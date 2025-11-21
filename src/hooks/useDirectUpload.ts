import { useState } from "react";
import { createBrowserSupabaseClient } from "@/src/infrastrucutre/supabse/browserClient";
import { getCurrentUserAction } from "@/src/app/actions/authActions";

type UploadPhase =
  | "uploading-zip"
  | "processing"
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

/**
 * Hook para subida directa a Supabase Storage
 * Evita el límite de 4.5MB de Vercel enviando el archivo directo a Supabase
 */
export function useDirectUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    message: "",
    filesUploaded: 0,
    totalFiles: 0,
    currentFileName: "",
    phase: "uploading-zip",
  });

  const updateState = (partial: Partial<UploadState>) => {
    setUploadState((prev) => ({ ...prev, ...partial }));
  };

  const startUpload = () => {
    updateState({
      isUploading: true,
      progress: 0,
      message: "Preparando subida...",
      filesUploaded: 0,
      totalFiles: 0,
      currentFileName: "",
      phase: "uploading-zip",
    });
  };

  /**
   * Sube el archivo ZIP directamente a Supabase Storage
   * y luego llama a la API para procesarlo
   */
  const uploadProduct = async (
    productId: string,
    zipFile: File
  ): Promise<UploadResult> => {
    try {
      // Validar tamaño (500MB máximo en Supabase)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (zipFile.size > maxSize) {
        throw new Error(
          `El archivo es demasiado grande (${(zipFile.size / (1024 * 1024)).toFixed(2)}MB). Máximo permitido: 500MB`
        );
      }

      updateState({
        progress: 5,
        message: "Autenticando...",
      });

      // Obtener el admin_id del usuario actual
      const userResult = await getCurrentUserAction();

      if (!userResult.success || !userResult.user || !userResult.user.id) {
        throw new Error("Usuario no autenticado");
      }

      const adminId = userResult.user.id as string;
      const supabase = createBrowserSupabaseClient();

      // 1. Subir el ZIP directamente a Supabase Storage
      updateState({
        phase: "uploading-zip",
        message: "Subiendo archivo a Supabase Storage...",
        progress: 10,
      });

      const zipPath = `temp/${adminId}/${productId}/${Date.now()}_${zipFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("files")
        .upload(zipPath, zipFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error subiendo a Supabase: ${uploadError.message}`);
      }

      updateState({
        progress: 30,
        message: "Archivo subido, procesando...",
        phase: "processing",
      });

      // 2. Llamar a la API para procesar el archivo subido
      const response = await fetch("/api/upload/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zipPath: uploadData.path,
          product_id: productId,
          admin_id: adminId,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Error en el procesamiento";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
          } catch {
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // 3. Procesar eventos SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No se pudo leer la respuesta");
      }

      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                const phase = data.phase;
                const eventType = data.type;

                if (eventType === "error") {
                  console.error("❌ [SSE] Error recibido:", data.message);
                  throw new Error(data.message || "Error en el proceso");
                }

                // Actualizar progreso basado en la fase
                if (phase === "extracting") {
                  updateState({
                    phase: "extracting",
                    message: "Extrayendo archivos del ZIP...",
                    progress: 40,
                  });
                } else if (phase === "extracted") {
                  updateState({
                    phase: "uploading-images",
                    message: `${data.imageCount || 0} imágenes extraídas`,
                    progress: 50,
                    totalFiles: data.imageCount || 0,
                  });
                } else if (phase === "uploading-images") {
                  const percentage = data.percentage || 0;
                  const uploaded = data.uploaded || 0;
                  updateState({
                    phase: "uploading-images",
                    message: data.message || "Subiendo imágenes...",
                    progress: 50 + percentage * 0.4,
                    filesUploaded: uploaded,
                    currentFileName: data.fileName || "",
                  });
                } else if (phase === "images-uploaded") {
                  updateState({
                    message: "Todas las imágenes subidas",
                    progress: 92,
                  });
                } else if (phase === "updating-product") {
                  updateState({
                    phase: "updating-product",
                    message: "Finalizando...",
                    progress: 95,
                  });
                }

                // Manejar evento de completado
                if (eventType === "complete") {
                  updateState({
                    phase: "complete",
                    message: "¡Completado!",
                    progress: 100,
                  });
                }
              } catch (e) {
                console.error("❌ [SSE] Error parseando evento:", e);
              }
            }
          }
        }
      }

      // Limpiar el archivo temporal
      try {
        await supabase.storage.from("files").remove([zipPath]);
      } catch (e) {
        console.warn("⚠️ No se pudo eliminar el archivo temporal:", e);
      }

      // Esperar un momento antes de cerrar el modal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateState({ isUploading: false });

      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error en upload directo:", err);
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
      phase: "uploading-zip",
    });
  };

  return {
    uploadState,
    uploadProduct,
    resetUpload,
    startUpload,
  };
}
