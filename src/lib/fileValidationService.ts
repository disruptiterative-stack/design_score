/**
 * Resultado de la validación
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Configuración de límites
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600"); // 100MB por defecto
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_ZIP_EXTENSIONS = [".zip"];

// Firmas de archivos (magic bytes) para validación
const FILE_SIGNATURES: { [key: string]: number[][] } = {
  zip: [
    [0x50, 0x4b, 0x03, 0x04], // ZIP
    [0x50, 0x4b, 0x05, 0x06], // ZIP (empty)
    [0x50, 0x4b, 0x07, 0x08], // ZIP (spanned)
  ],
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (necesita verificar WEBP después)
};

/**
 * Servicio para validar archivos ZIP
 */
export class FileValidationService {
  /**
   * Valida el tamaño del archivo
   */
  validateFileSize(size: number): ValidationResult {
    if (size > MAX_FILE_SIZE) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2);
      const currentSizeMB = (size / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        error: `El archivo es demasiado grande (${currentSizeMB}MB). Tamaño máximo permitido: ${maxSizeMB}MB`,
      };
    }
    return { isValid: true };
  }

  /**
   * Valida la firma del archivo (magic bytes)
   */
  validateFileSignature(
    buffer: Buffer,
    type: keyof typeof FILE_SIGNATURES
  ): ValidationResult {
    const signatures = FILE_SIGNATURES[type];
    if (!signatures) {
      return { isValid: false, error: "Tipo de archivo no soportado" };
    }

    const isValid = signatures.some((signature) =>
      signature.every((byte, index) => buffer[index] === byte)
    );

    if (!isValid) {
      return {
        isValid: false,
        error: `El archivo no es un ${String(
          type
        ).toUpperCase()} válido (firma inválida)`,
      };
    }

    return { isValid: true };
  }

  /**
   * Valida que el archivo sea un ZIP
   */
  validateZipExtension(fileName: string): ValidationResult {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));
    const isZip = ALLOWED_ZIP_EXTENSIONS.includes(extension);

    if (!isZip) {
      return {
        isValid: false,
        error:
          "Solo se permiten archivos .zip. Por favor, convierte tu archivo a formato ZIP.",
      };
    }

    return { isValid: true };
  }

  /**
   * Valida que el buffer sea un archivo ZIP válido
   */
  validateZipContent(buffer: Buffer): ValidationResult {
    // Primero validar la firma del archivo
    const signatureValidation = this.validateFileSignature(buffer, "zip");
    if (!signatureValidation.isValid) {
      return signatureValidation;
    }

    try {
      const AdmZip = require("adm-zip");
      const testZip = new AdmZip(buffer);
      const entries = testZip.getEntries();

      // Validar que no esté vacío
      if (entries.length === 0) {
        return {
          isValid: false,
          error: "El archivo ZIP está vacío",
        };
      }

      // Validar que no contenga demasiados archivos
      if (entries.length > 10000) {
        return {
          isValid: false,
          error: "El archivo ZIP contiene demasiados archivos (máximo 10,000)",
        };
      }

      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Archivo ZIP corrupto o inválido: ${error.message}`,
      };
    }
  }

  /**
   * Valida que exista un archivo
   */
  validateFileExists(file: File | null): ValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: "No se proporcionó archivo",
      };
    }
    return { isValid: true };
  }

  /**
   * Valida los parámetros requeridos
   */
  validateRequiredParams(
    params: Record<string, string | null>
  ): ValidationResult {
    const missing = Object.entries(params)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Se requiere: ${missing.join(", ")}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitiza nombres de archivo removiendo caracteres peligrosos
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Reemplazar caracteres no seguros
      .replace(/\.{2,}/g, ".") // Evitar secuencias de puntos
      .substring(0, 255); // Limitar longitud
  }
}
