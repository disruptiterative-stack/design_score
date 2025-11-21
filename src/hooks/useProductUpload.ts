import { useState } from "react";
import { getCurrentUserAction } from "@/src/app/actions/authActions";

type UploadPhase =
  | "extracting"
  | "uploading-images"
  | "updating-product"
  | "complete";

interface UploadState {
  isUploading: boolean;
  progress: number;
  message: string;
  filesUploaded: number;
  totalFiles: number;
  currentFileName: string;
  phase: UploadPhase;
}

interface UploadResult {
  success: boolean;
  error?: string;
}

export function useProductUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    message: "",
    filesUploaded: 0,
    totalFiles: 0,
    currentFileName: "",
    phase: "extracting",
  });

  const updateState = (partial: Partial<UploadState>) => {
    setUploadState((prev) => ({ ...prev, ...partial }));
  };

  const startUpload = () => {
    updateState({
      isUploading: true,
      progress: 0,
      message: "Creando producto...",
      filesUploaded: 0,
      totalFiles: 0,
      currentFileName: "",
      phase: "extracting",
    });
  };

  const uploadProduct = async (
    productId: string,
    zipFile: File
  ): Promise<UploadResult> => {
    try {
      updateState({
        progress: 5,
        message: "Procesando archivo ZIP...",
      });

      // Obtener el admin_id del usuario actual
      const userResult = await getCurrentUserAction();

      if (!userResult.success || !userResult.user || !userResult.user.id) {
        throw new Error("Usuario no autenticado");
      }

      const adminId = userResult.user.id as string;

      // Preparar FormData
      updateState({ message: "Procesando archivo ZIP...", progress: 15 });

      const formData = new FormData();
      formData.append("file", zipFile);
      formData.append("product_id", productId);
      formData.append("admin_id", adminId);

      // Hacer fetch a la API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en la subida");
      }

      // Procesar eventos SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No se pudo leer la respuesta");
      }

      let done = false;
      let buffer = "";

      /*       console.log("🔄 [Upload] Iniciando lectura del stream SSE...");
       */
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          //console.log("📦 [SSE] Chunk recibido, buffer size:", buffer.length);

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                /*     console.log("📨 [SSE] Evento recibido:", data); */

                const phase = data.phase;
                const eventType = data.type;

                if (eventType === "error") {
                  console.error("❌ [SSE] Error recibido:", data.message);
                  throw new Error(data.message || "Error en el proceso");
                }

                // Actualizar progreso basado en la fase
                if (phase === "upload-complete") {
                  /*          console.log("✅ [SSE] Archivo recibido en servidor"); */
                  updateState({
                    message: "Archivo recibido en el servidor...",
                    progress: 15,
                  });
                } else if (phase === "extracting") {
                  /*                  console.log("🔄 [SSE] Extrayendo archivos..."); */
                  updateState({
                    phase: "extracting",
                    message: "Extrayendo archivos del ZIP...",
                    progress: 20,
                  });
                } else if (phase === "extracted") {
                  /*                   console.log(
                    `✅ [SSE] ${data.imageCount || 0} imágenes extraídas`
                  ); */
                  updateState({
                    phase: "uploading-images",
                    message: `${data.imageCount || 0} imágenes extraídas`,
                    progress: 30,
                    totalFiles: data.imageCount || 0,
                  });
                } else if (phase === "uploading-images") {
                  const percentage = data.percentage || 0;
                  const uploaded = data.uploaded || 0;
                  /*  const total = data.total || 0; */
                  /*          console.log(
                    `📊 [SSE] Subiendo: ${uploaded}/${total} (${percentage}%)`
                  ); */
                  updateState({
                    phase: "uploading-images",
                    message: data.message || "Subiendo imágenes...",
                    progress: 30 + percentage * 0.6,
                    filesUploaded: uploaded,
                    currentFileName: data.fileName || "",
                  });
                } else if (phase === "images-uploaded") {
                  /*         console.log("✅ [SSE] Todas las imágenes subidas"); */
                  updateState({
                    message: "Todas las imágenes subidas",
                    progress: 92,
                  });
                } else if (phase === "updating-product") {
                  /*        console.log("🔄 [SSE] Actualizando producto..."); */
                  updateState({
                    phase: "updating-product",
                    message: "Finalizando...",
                    progress: 95,
                  });
                }

                // Manejar evento de completado
                if (eventType === "complete") {
                  /*          console.log("🎉 [SSE] ¡Proceso completado!"); */
                  updateState({
                    phase: "complete",
                    message: "¡Completado!",
                    progress: 100,
                  });
                  /* console.log("✅ Subida completa:", data); */
                }
              } catch (e) {
                console.error(
                  "❌ [SSE] Error parseando evento:",
                  e,
                  "Línea:",
                  line
                );
              }
            } else if (line.trim()) {
              /*       console.log("⚠️ [SSE] Línea no reconocida:", line); */
            }
          }
        }
      }

      // Esperar un momento antes de cerrar el modal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateState({ isUploading: false });

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error en upload:", err);
      updateState({ isUploading: false });
      return { success: false, error: err.message };
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      message: "",
      filesUploaded: 0,
      totalFiles: 0,
      currentFileName: "",
      phase: "extracting",
    });
  };

  return {
    uploadState,
    uploadProduct,
    resetUpload,
    startUpload,
  };
}
