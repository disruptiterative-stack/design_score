import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";

/**
 * Configuración para la subida de imágenes
 */
export interface UploadConfig {
  batchSize: number; // Número de imágenes a subir en paralelo
  delayBetweenBatches: number; // Milisegundos entre lotes
  delayBetweenFiles: number; // Milisegundos entre archivos individuales
}

/**
 * Callback para reportar progreso de subida
 */
export type ProgressCallback = (data: {
  uploadedCount: number;
  total: number;
  currentFileName: string;
  percentage: number;
  message: string;
}) => void;

/**
 * Resultado de la subida de imágenes
 */
export interface UploadResult {
  uploadedImages: string[];
  totalSizeMB: number;
  coverImageUrl: string | null;
  storagePathUrl: string | null;
  failedImages: Array<{ fileName: string; error: string }>;
}

/**
 * Servicio para manejar la subida de imágenes a Supabase Storage
 */
export class ImageUploadService {
  private config: UploadConfig = {
    batchSize: 5, // Balance óptimo: 5 archivos por lote
    delayBetweenBatches: 400, // 400ms entre lotes - balance velocidad/estabilidad
    delayBetweenFiles: 0, // Sin delay entre archivos dentro del batch (suben en paralelo)
  };

  constructor(
    private storageRepository: SupabaseStorageRepository,
    config?: Partial<UploadConfig>
  ) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Calcula el tamaño total de las imágenes en MB
   */
  calculateTotalSize(imageFiles: Map<string, Buffer>): number {
    let totalSizeBytes = 0;
    for (const [, imageBuffer] of imageFiles.entries()) {
      totalSizeBytes += imageBuffer.length;
    }
    return totalSizeBytes / (1024 * 1024); // Convertir a MB
  }

  /**
   * Ordena las imágenes alfabéticamente para tener un orden consistente
   */
  sortImages(imageFiles: Map<string, Buffer>): Array<[string, Buffer]> {
    const imageArray = Array.from(imageFiles.entries());

    imageArray.sort((a, b) => {
      const nameA = a[0].toLowerCase();
      const nameB = b[0].toLowerCase();
      return nameA.localeCompare(nameB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return imageArray;
  }

  /**
   * Sube las imágenes en lotes con progreso
   */
  async uploadImages(
    imageFiles: Map<string, Buffer>,
    storagePath: string,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    const uploadedImages: string[] = [];
    const failedImages: Array<{ fileName: string; error: string }> = [];
    let uploadedCount = 0;

    // Calcular tamaño total
    const totalSizeMB = this.calculateTotalSize(imageFiles);

    // Ordenar imágenes
    const imageArray = this.sortImages(imageFiles);
    const total = imageArray.length;

    // Subir en lotes
    const { batchSize, delayBetweenBatches, delayBetweenFiles } = this.config;

    for (let i = 0; i < imageArray.length; i += batchSize) {
      const batch = imageArray.slice(i, i + batchSize);

      // Preparar el batch para subida
      const batchUploads = batch.map(([fileName, imageBuffer]) => ({
        filePath: `${storagePath}/${fileName}`,
        buffer: imageBuffer,
        contentType: "image/png",
      }));

      // Subir el lote completo en paralelo con delay entre archivos
      const results = await this.storageRepository.uploadBuffersBatch(
        batchUploads,
        delayBetweenFiles
      );

      // Procesar resultados del lote
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const fileName = batch[j][0];

        if (!result.ok || result.error) {
          console.error(
            `❌ [ImageUploadService] Error subiendo ${fileName}:`,
            result.error
          );
          failedImages.push({
            fileName,
            error: result.error || "Error desconocido",
          });
        } else {
          uploadedImages.push(result.filePath);
          uploadedCount++;
        }

        // Reportar progreso solo cada 5 imágenes o en la última imagen
        // Esto reduce la saturación del stream SSE
        const shouldReport =
          uploadedCount % 5 === 0 ||
          uploadedCount === total ||
          j === results.length - 1;

        if (onProgress && shouldReport) {
          onProgress({
            uploadedCount,
            total,
            currentFileName: fileName,
            percentage: Math.round((uploadedCount / total) * 100),
            message: `Subiendo imágenes: ${uploadedCount}/${total}`,
          });
        }
      }

      // Delay entre lotes para evitar saturar Supabase
      if (i + batchSize < imageArray.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenBatches)
        );
      }
    }

    // Obtener URLs de cover_image y storage path
    let coverImageUrl: string | null = null;
    let storagePathUrl: string | null = null;

    if (uploadedImages.length > 0) {
      const firstImagePath = uploadedImages[0];
      const { url } = await this.storageRepository.getFileUrl(firstImagePath);
      coverImageUrl = url;

      // Extraer la URL base de la carpeta
      if (url) {
        const lastSlashIndex = url.lastIndexOf("/");
        storagePathUrl = url.substring(0, lastSlashIndex);
      }
    }

    return {
      uploadedImages,
      totalSizeMB,
      coverImageUrl,
      storagePathUrl,
      failedImages,
    };
  }
}
