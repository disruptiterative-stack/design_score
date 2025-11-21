import AdmZip from "adm-zip";
import fs from "fs/promises";
import path, { basename } from "path";
import { createExtractorFromData } from "node-unrar-js";

/**
 * Extrae constantes JavaScript del archivo HTML de KeyShot
 */
export function extractConstantsFromHTML(
  htmlText: string
): Record<string, any> {
  const regex = /var\s+(\w+)\s*=\s*([^;]+);/g;
  const constants: Record<string, any> = {};
  let match: RegExpExecArray | null;

  while ((match = regex.exec(htmlText)) !== null) {
    const name = match[1];
    let value: any = match[2].trim();

    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      value = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      value = value === "true";
    } else if (!isNaN(Number(value))) {
      value = Number(value);
    } else if (value === "{}") {
      value = {};
    }

    constants[name] = value;
  }

  return constants;
}

/**
 * Extrae archivos de un ZIP
 */
export async function extractZipFile(
  zipBuffer: Buffer
): Promise<Map<string, Buffer>> {
  const fileMap = new Map<string, Buffer>();
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    if (!entry.isDirectory) {
      const content = entry.getData();
      fileMap.set(entry.entryName, content);
    }
  }

  return fileMap;
}

/**
 * Extrae archivos de un RAR
 * NOTA: El soporte RAR es experimental y puede no funcionar en todos los entornos.
 * Se recomienda usar archivos ZIP para mejor compatibilidad.
 */
export async function extractRarFile(
  rarBuffer: Buffer
): Promise<Map<string, Buffer>> {
  const fileMap = new Map<string, Buffer>();

  try {
    /*     // Asegurar que pasamos un Uint8Array con el ArrayBuffer y offset correctos
    const uint8 = new Uint8Array(
      rarBuffer.buffer,
      rarBuffer.byteOffset,
      rarBuffer.byteLength
    );

    // node-unrar-js espera un ArrayBuffer; crear una vista exacta con slice
    const arrayBuffer = uint8.buffer.slice(
      uint8.byteOffset,
      uint8.byteOffset + uint8.byteLength
    ); */

    // Convertir Buffer a ArrayBuffer de forma segura para node-unrar-js
    /*     const uint8 = new Uint8Array(
      rarBuffer.buffer,
      rarBuffer.byteOffset,
      rarBuffer.byteLength
    );
    const arrayBuffer = uint8.buffer.slice(
      uint8.byteOffset,
      uint8.byteOffset + uint8.byteLength
    ); */

    const extractor = await createExtractorFromData({
      data: rarBuffer as unknown as ArrayBuffer,
    });

    const list = extractor.getFileList();
    const fileHeaders = [...list.fileHeaders];

    for (const fileHeader of fileHeaders) {
      if (!fileHeader.flags.directory) {
        const extracted = extractor.extract({ files: [fileHeader.name] });
        const files = [...extracted.files];

        if (files.length > 0 && files[0].extraction) {
          const content = Buffer.from(files[0].extraction);
          fileMap.set(fileHeader.name, content);
        }
      }
    }
  } catch (error) {
    console.error("Error extrayendo RAR:", error);

    // Mensaje más descriptivo para archivos RAR
    throw new Error(
      "No se pudo procesar el archivo RAR. Por favor, convierte el archivo a formato ZIP y vuelve a intentarlo. Los archivos ZIP son más compatibles y rápidos de procesar."
    );
  }

  return fileMap;
}

/**
 * Procesa archivos extraídos del ZIP/RAR (HTML + imágenes PNG/JPG)
 * Retorna constantes y lista de archivos de imagen
 */
export async function processExtractedFiles(
  filesMap: Map<string, Buffer>
): Promise<{
  constants: Record<string, any>;
  imageFiles: Map<string, Buffer>;
}> {
  const imageFiles = new Map<string, Buffer>();
  let htmlContent: string | null = null;

  // Filtrar archivos relevantes
  for (const [fileName, fileBuffer] of filesMap.entries()) {
    const baseName = path.basename(fileName).toLowerCase();

    // Buscar archivo HTML principal (excluir instructions.html)
    if (
      baseName.endsWith(".html") &&
      !baseName.includes("instructions") &&
      !baseName.includes("instruction")
    ) {
      htmlContent = fileBuffer.toString("utf-8");
    }

    // Buscar solo imágenes PNG, JPG o JPEG (excluir iconos de KeyShot e instructions)
    const isImageFile =
      baseName.endsWith(".png") ||
      baseName.endsWith(".jpg") ||
      baseName.endsWith(".jpeg");

    const isExcludedFile =
      baseName.includes("instructions") ||
      baseName.includes("instruction") ||
      baseName.startsWith("gofixedsizeicon") ||
      baseName.startsWith("gofullscreenicon") ||
      baseName.startsWith("80x80") ||
      baseName.startsWith("ks_logo") ||
      baseName.includes("xr_cursor") ||
      baseName.includes("xr_hand");

    if (isImageFile && !isExcludedFile) {
      // Usar el nombre original del archivo (con mayúsculas/minúsculas correctas)
      const originalBaseName = path.basename(fileName);
      imageFiles.set(originalBaseName, fileBuffer);
    }
  }

  if (!htmlContent) {
    throw new Error("No se encontró archivo HTML principal en el archivo");
  }

  const constants = extractConstantsFromHTML(htmlContent);

  return { constants, imageFiles };
}

/**
 * Procesa un archivo ZIP/RAR completo: extrae, procesa y retorna datos
 */
export async function processZipFile(
  zipBuffer: Buffer,
  isRar: boolean = false
): Promise<{
  constants: Record<string, any>;
  imageFiles: Map<string, Buffer>;
}> {
  // 1. Extraer archivos del ZIP o RAR
  const extractedFiles = isRar
    ? await extractRarFile(zipBuffer)
    : await extractZipFile(zipBuffer);

  // 2. Procesar archivos extraídos
  const result = await processExtractedFiles(extractedFiles);

  return result;
}
