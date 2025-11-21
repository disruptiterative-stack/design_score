/**
 * Callback para reportar progreso de procesamiento de archivos
 */
export interface UploadProgressCallback {
  (data: {
    fileIndex: number;
    totalFiles: number;
    phase: string;
    progress: number;
    message: string;
    imageCount?: number;
    uploaded?: number;
    total?: number;
  }): void;
}

/**
 * Callback para reportar errores
 */
export interface UploadErrorCallback {
  (error: { fileIndex: number; message: string }): void;
}

/**
 * Resultado del procesamiento de un archivo
 */
export interface FileProcessResult {
  success: boolean;
  imageCount?: number;
  error?: string;
}

/**
 * Servicio para procesar streams de Server-Sent Events de uploads
 */
export class SSEUploadProcessor {
  /**
   * Procesa un archivo individual con streaming SSE
   */
  static async processFile(
    formData: FormData,
    fileIndex: number,
    totalFiles: number,
    onProgress?: UploadProgressCallback,
    onError?: UploadErrorCallback
  ): Promise<FileProcessResult> {
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Error en respuesta (primeros 500 chars):",
          errorText.substring(0, 500)
        );

        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        if (errorText.includes("Error:")) {
          const match = errorText.match(/Error:\s*([^<\n]+)/);
          if (match) {
            errorMessage = match[1];
          }
        }

        throw new Error(errorMessage);
      }

      // Verificar que la respuesta es un stream SSE
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("text/event-stream")) {
        const text = await response.text();
        console.error(
          "❌ Respuesta no es SSE (primeros 500 chars):",
          text.substring(0, 500)
        );
        throw new Error(
          "El servidor no respondió con un stream válido. Revisa los logs del servidor."
        );
      }

      // Procesar el stream
      const result = await this.readSSEStream(
        response,
        fileIndex,
        totalFiles,
        onProgress
      );

      return result;
    } catch (error: any) {
      console.error(
        `❌ Error procesando archivo ${fileIndex + 1}:`,
        error.message
      );

      if (onError) {
        onError({ fileIndex, message: error.message });
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lee y procesa el stream SSE
   */
  private static async readSSEStream(
    response: Response,
    fileIndex: number,
    totalFiles: number,
    onProgress?: UploadProgressCallback
  ): Promise<FileProcessResult> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No se pudo obtener el reader del stream");
    }

    let done = false;
    let buffer = "";
    let imageCount = 0;

    const baseProgress = (fileIndex / totalFiles) * 100;
    const progressRange = 100 / totalFiles;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Guardar la última línea incompleta
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.substring(6).trim();

              // Saltar líneas vacías
              if (!jsonStr) continue;

              // Verificar que parece JSON
              if (!jsonStr.startsWith("{") && !jsonStr.startsWith("[")) {
                console.warn("Línea SSE no es JSON:", jsonStr.substring(0, 50));
                continue;
              }

              const data = JSON.parse(jsonStr);

              if (data.type === "progress") {
                const phaseData = this.calculatePhaseProgress(
                  data,
                  baseProgress,
                  progressRange
                );

                if (onProgress) {
                  onProgress({
                    fileIndex,
                    totalFiles,
                    phase: data.phase,
                    progress: phaseData.totalProgress,
                    message: phaseData.message,
                    imageCount: data.imageCount,
                    uploaded: data.uploaded,
                    total: data.total,
                  });
                }
              } else if (data.type === "complete") {
                imageCount = data.imageCount || 0;
                const totalProgress = baseProgress + progressRange;

                if (onProgress) {
                  onProgress({
                    fileIndex,
                    totalFiles,
                    phase: "complete",
                    progress: Math.round(totalProgress),
                    message: `Archivo ${
                      fileIndex + 1
                    }/${totalFiles} completado - ${imageCount} imágenes`,
                    imageCount,
                  });
                }

                console.log(
                  `✅ Archivo ${
                    fileIndex + 1
                  } procesado: ${imageCount} imágenes`
                );
              } else if (data.type === "error") {
                console.error(`❌ Error: ${data.message}`);
                throw new Error(data.message);
              }
            } catch (parseError: any) {
              // Ignorar errores de parsing de líneas incompletas
              if (!line.includes("</html>")) {
                console.warn(
                  "Error parseando línea SSE:",
                  parseError.message,
                  "Línea:",
                  line.substring(0, 50)
                );
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      imageCount,
    };
  }

  /**
   * Calcula el progreso basado en la fase del proceso
   */
  private static calculatePhaseProgress(
    data: any,
    baseProgress: number,
    progressRange: number
  ): { totalProgress: number; message: string } {
    let phaseProgress = 0;
    let message = "";

    switch (data.phase) {
      case "upload-complete":
        phaseProgress = 10;
        message = "Recibido en servidor";
        break;
      case "extracting":
        phaseProgress = 20;
        message = "Extrayendo archivos...";
        break;
      case "extracted":
        phaseProgress = 30;
        message = `${data.imageCount} imágenes extraídas`;
        break;
      case "uploading-images":
        // 30% base + hasta 65% según progreso de imágenes
        phaseProgress = 30 + (data.percentage || 0) * 0.65;
        message = `Subiendo imagen ${data.uploaded}/${data.total} (${data.percentage}%)`;
        break;
      case "images-uploaded":
        phaseProgress = 95;
        message = `${data.uploaded} imágenes subidas`;
        break;
      case "updating-product":
        phaseProgress = 98;
        message = "Actualizando producto...";
        break;
      default:
        phaseProgress = 0;
        message = "Procesando...";
    }

    const totalProgress = baseProgress + (phaseProgress / 100) * progressRange;

    return {
      totalProgress: Math.round(totalProgress),
      message,
    };
  }

  /**
   * Procesa múltiples archivos secuencialmente
   */
  static async processMultipleFiles(
    files: File[],
    productIds: string[],
    adminId: string,
    onProgress?: UploadProgressCallback,
    onError?: UploadErrorCallback
  ): Promise<FileProcessResult[]> {
    const results: FileProcessResult[] = [];

    for (let i = 0; i < Math.min(files.length, productIds.length); i++) {
      const file = files[i];
      const productId = productIds[i];

      const formData = new FormData();
      formData.append("file", file);
      formData.append("product_id", productId);
      formData.append("admin_id", adminId);

      const result = await this.processFile(
        formData,
        i,
        files.length,
        onProgress,
        onError
      );

      results.push(result);

      // Pequeño delay entre archivos
      if (i < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }
}
