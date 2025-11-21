import imageCompression from "browser-image-compression";

/**
 * Extrae constantes JavaScript del archivo HTML de KeyShot
 */
/* export function extractConstantsFromHTML(
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
} */

/**
 * Comprime una imagen PNG a WebP manteniendo el nombre original
 */
/* export async function compressImage(file: File): Promise<File> {
  try {
    const options = {
      maxSizeMB: 1, // Máximo 1MB por imagen
      maxWidthOrHeight: 2048, // Redimensionar si es más grande
      useWebWorker: true, // No bloquear UI
      fileType: "image/webp", // Convertir a WebP (mejor compresión)
      initialQuality: 0.9, // Alta calidad
    };

    const compressedFile = await imageCompression(file, options);

    // Mantener el nombre original (cambiar .webp por .png)
    const originalName = file.name; // Ej: "0_0.png"
    const renamedFile = new File([compressedFile], originalName, {
      type: compressedFile.type,
      lastModified: compressedFile.lastModified,
    });

        console.log(
      `✅ Comprimido: ${originalName} (${(file.size / 1024).toFixed(1)}KB → ${(
        renamedFile.size / 1024
      ).toFixed(1)}KB)`
    );

    return renamedFile;
  } catch (error) {
    console.warn(`⚠️ No se pudo comprimir ${file.name}, usando original`);
    return file; // Fallback al archivo original
  }
} */

/**
 * Procesa archivos de una carpeta KeyShot (HTML + imágenes PNG)
 * Comprime las imágenes y extrae constantes del HTML
 */
/* export async function processFiles(selectedFiles: FileList): Promise<{
  parsedConstants: string;
  images: File[];
}> {
  const files = Array.from(selectedFiles).filter((file) => {
    return (
      (file.name.endsWith(".png") || file.name.endsWith(".html")) &&
      !file.name.startsWith("instructions") &&
      !file.name.startsWith("GoFixedSizeIcon") &&
      !file.name.startsWith("GoFullScreenIcon") &&
      !file.name.startsWith("80X80") &&
      !file.name.startsWith("ks_logo")
    );
  });

  const imageFiles = files.filter((file) => file.name.endsWith(".png"));
  const mainHtmlFile = files.find((file) => file.name.endsWith(".html"));

  if (!mainHtmlFile) throw new Error("No se encontró archivo HTML principal");

  const images = await Promise.all(imageFiles.map(compressImage));

  const fileReader = new FileReader();

  const parsedConstants = await new Promise<string>((resolve, reject) => {
    fileReader.onload = () => {
      try {
        const text = fileReader.result as string;
        const constants = extractConstantsFromHTML(text);
        resolve(JSON.stringify(constants));
      } catch {
        reject("Error al procesar main.html");
      }
    };
    fileReader.onerror = () => reject("No se pudo leer el archivo HTML");
    fileReader.readAsText(mainHtmlFile);
  });

  return { parsedConstants, images };
} */
