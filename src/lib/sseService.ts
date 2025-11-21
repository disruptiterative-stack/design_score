/**
 * Tipos de eventos SSE
 */
export type SSEEventType = "progress" | "error" | "complete";

/**
 * Fases del proceso de subida
 */
export type UploadPhase =
  | "upload-complete"
  | "extracting"
  | "extracted"
  | "uploading-images"
  | "images-uploaded"
  | "updating-product";

/**
 * Datos de un mensaje SSE
 */
export interface SSEMessage {
  type: SSEEventType;
  phase?: UploadPhase;
  message: string;
  [key: string]: any; // Datos adicionales específicos del evento
}

/**
 * Servicio para manejar Server-Sent Events (SSE)
 */
export class SSEService {
  private encoder = new TextEncoder();

  constructor(private controller: ReadableStreamDefaultController) {}

  /**
   * Envía un mensaje al cliente a través de SSE
   */
  send(data: SSEMessage): void {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      /*  console.log("📤 [SSEService] Enviando evento:", data); */
      this.controller.enqueue(this.encoder.encode(message));
    } catch (err) {
      console.error("❌ [SSEService] Error enviando mensaje SSE:", err);
    }
  }

  /**
   * Envía un mensaje de progreso
   */
  sendProgress(
    phase: UploadPhase,
    message: string,
    extraData?: Record<string, any>
  ): void {
    this.send({
      type: "progress",
      phase,
      message,
      ...extraData,
    });
  }

  /**
   * Envía un mensaje de error
   */
  sendError(message: string, error?: any): void {
    this.send({
      type: "error",
      message,
      stack:
        process.env.NODE_ENV === "development" && error?.stack
          ? error.stack
          : undefined,
    });
  }

  /**
   * Envía un mensaje de completado
   */
  sendComplete(message: string, data: Record<string, any>): void {
    this.send({
      type: "complete",
      message,
      ...data,
    });
  }

  /**
   * Cierra la conexión SSE
   */
  close(): void {
    try {
      this.controller.close();
    } catch (err) {
      console.error("❌ [SSEService] Error cerrando controller:", err);
    }
  }
}
