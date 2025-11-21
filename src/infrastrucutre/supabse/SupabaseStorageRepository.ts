import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import SupabaseClient from "@supabase/supabase-js/dist/module/SupabaseClient";

export class SupabaseStorageRepository implements IStorageRepository {
  constructor(private supabaseClient: SupabaseClient) {}

  async deleteFile(
    filePath: string
  ): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await this.supabaseClient.storage
      .from("files")
      .remove([filePath]);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  }

  async deleteFiles(
    filePaths: string[]
  ): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await this.supabaseClient.storage
      .from("files")
      .remove(filePaths);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  }

  async listFiles(folderPath: string): Promise<{
    ok: boolean;
    data: { name: string; id: string }[] | null;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient.storage
      .from("files")
      .list(folderPath);

    if (error) {
      return { ok: false, data: null, error: error.message };
    }

    return { ok: true, data: data || [], error: null };
  }

  async deleteFolder(
    folderPath: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      /*       console.log(`🗑️  Intentando eliminar carpeta: ${folderPath}`); */

      // Recolectar todos los archivos recursivamente con paginación
      const allFiles = await this.listAllFilesRecursively(folderPath);

      if (allFiles.length === 0) {
        console.log(`✅ Carpeta ${folderPath} está vacía o no existe`);
        return { ok: true, error: null };
      }

      /*       console.log(
        `📁 Encontrados ${allFiles.length} archivos en ${folderPath}`
      );
      console.log(`🔍 Primeros archivos:`, allFiles.slice(0, 5)); */

      // Eliminar todos los archivos en lotes de 50 (más conservador)
      const batchSize = 50;
      /*       let totalDeleted = 0; */

      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        /*         const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(allFiles.length / batchSize); */

        /*         console.log(
          `🗑️  Eliminando lote ${batchNum}/${totalBatches} (${batch.length} archivos)...`
        );
        console.log(`   Archivos en este lote:`, batch.slice(0, 3)); */

        const { error: deleteError } = await this.supabaseClient.storage
          .from("files")
          .remove(batch);

        if (deleteError) {
          console.error(
            `❌ Error eliminando archivos de ${folderPath}:`,
            deleteError
          );
          // Continuar con el siguiente lote en lugar de fallar completamente
          console.warn(`⚠️  Continuando con el siguiente lote...`);
        } else {
          /*     totalDeleted += batch.length; */
          /*       console.log(
            `✅ Lote ${batchNum} eliminado. Total eliminado: ${totalDeleted}/${allFiles.length}`
          ); */
        }

        // Pequeño delay entre lotes para no saturar Supabase
        if (i + batchSize < allFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Verificar si quedan archivos
      /*     console.log(`🔍 Verificando archivos restantes en ${folderPath}...`); */
      const remainingFiles = await this.listAllFilesRecursively(folderPath);

      if (remainingFiles.length > 0) {
        console.warn(
          `⚠️  Quedan ${remainingFiles.length} archivos sin eliminar`
        );
        /*         console.warn(`   Ejemplos:`, remainingFiles.slice(0, 5));
        // Intentar eliminar los archivos restantes de nuevo
        console.log(`🔄 Reintentando eliminación de archivos restantes...`); */
        const { error: retryError } = await this.supabaseClient.storage
          .from("files")
          .remove(remainingFiles.slice(0, 100)); // Limitar a 100 en el reintento

        if (retryError) {
          console.error(`❌ Error en reintento:`, retryError);
        }
      }

      /*       console.log(
        `✅ Carpeta ${folderPath} procesada (${totalDeleted} archivos eliminados)`
      ); */
      return { ok: true, error: null };
    } catch (err) {
      const error = err as Error;
      console.error(`❌ Error eliminando carpeta ${folderPath}:`, error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Lista todos los archivos en una carpeta recursivamente con paginación
   */
  private async listAllFilesRecursively(
    folderPath: string,
    accumulated: string[] = []
  ): Promise<string[]> {
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    // Paginar para obtener todos los items
    while (hasMore) {
      const { data: files, error: listError } =
        await this.supabaseClient.storage.from("files").list(folderPath, {
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

      if (listError) {
        console.error(
          `❌ Error listando carpeta ${folderPath} (offset ${offset}):`,
          listError
        );
        break;
      }

      if (!files || files.length === 0) {
        hasMore = false;
        break;
      }

      /*       console.log(
        `📄 Listando ${folderPath}: encontrados ${files.length} items (offset ${offset})`
      ); */

      for (const file of files) {
        const fullPath = `${folderPath}/${file.name}`;

        // Si es un archivo (tiene id), agregarlo a la lista
        if (file.id) {
          accumulated.push(fullPath);
        } else {
          // Si es una carpeta (id es null), explorarla recursivamente
          await this.listAllFilesRecursively(fullPath, accumulated);
        }
      }

      // Si obtuvimos menos archivos que el límite, no hay más páginas
      if (files.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return accumulated;
  }

  /**
   * Lista todas las carpetas en una ruta recursivamente con paginación
   */
  private async listAllFoldersRecursively(
    folderPath: string,
    accumulated: string[] = []
  ): Promise<string[]> {
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: files, error: listError } =
        await this.supabaseClient.storage.from("files").list(folderPath, {
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

      if (listError || !files || files.length === 0) {
        hasMore = false;
        break;
      }

      for (const file of files) {
        const fullPath = `${folderPath}/${file.name}`;

        // Si es una carpeta (id es null), agregarla y explorarla recursivamente
        if (!file.id) {
          accumulated.push(fullPath);
          await this.listAllFoldersRecursively(fullPath, accumulated);
        }
      }

      if (files.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return accumulated;
  }

  async getFileUrl(filePath: string): Promise<{ url: string | null }> {
    const { data } = await this.supabaseClient.storage
      .from("files")
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  }

  async uploadFile(
    filePath: string,
    file: File
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }> {
    try {
      /*       console.log(
        `📤 [SupabaseStorageRepository] Subiendo archivo: ${filePath} (${(
          file.size / 1024
        ).toFixed(2)} KB)`
      ); */

      const { data, error } = await this.supabaseClient.storage
        .from("files")
        .upload(filePath, file, {
          upsert: true, // ✅ Sobrescribir si ya existe
        });

      if (error) {
        console.error(
          `❌ [SupabaseStorageRepository] Error subiendo ${filePath}:`,
          error
        );
        return { ok: false, error: error.message, data: null };
      }

      console.log(`✅ [SupabaseStorageRepository] Archivo subido: ${filePath}`);
      return { ok: true, error: null, data };
    } catch (err) {
      const error = err as Error;
      console.error(
        `❌ [SupabaseStorageRepository] Excepción subiendo ${filePath}:`,
        error
      );
      return { ok: false, error: error.message, data: null };
    }
  }

  async uploadBuffer(
    filePath: string,
    buffer: Buffer,
    contentType: string = "application/octet-stream"
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1s entre reintentos (reducido de 2s)

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from("files")
          .upload(filePath, buffer, {
            contentType: contentType,
            upsert: true, // ✅ Sobrescribir si ya existe
          });

        if (error) {
          console.error(
            `❌ Error en uploadBuffer para ${filePath} (intento ${attempt}/${MAX_RETRIES}):`,
            error
          );

          // Si es el último intento, devolver el error
          if (attempt === MAX_RETRIES) {
            return {
              ok: false,
              error: error.message || String(error),
              data: null,
            };
          }

          // Esperar antes de reintentar (delay exponencial)
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * attempt)
          );
          continue; // Reintentar
        }

        // ✅ Subida exitosa
        if (attempt > 1) {
          console.log(
            `✅ Subida exitosa en intento ${attempt} para ${filePath}`
          );
        }
        return { ok: true, error: null, data };
      } catch (err) {
        const error = err as Error;
        console.error(
          `❌ Excepción en uploadBuffer para ${filePath} (intento ${attempt}/${MAX_RETRIES}):`,
          error
        );

        // Si es el último intento, devolver el error
        if (attempt === MAX_RETRIES) {
          return {
            ok: false,
            error: `Falló después de ${MAX_RETRIES} intentos: ${
              error.message || String(error)
            }`,
            data: null,
          };
        }

        // Esperar antes de reintentar
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
      }
    }

    // Esto nunca debería ejecutarse, pero TypeScript lo requiere
    return {
      ok: false,
      error: "Error desconocido en uploadBuffer",
      data: null,
    };
  }

  /**
   * Sube múltiples buffers de forma optimizada
   * Si delayBetweenFiles es 0, sube en paralelo (más rápido)
   * Si delayBetweenFiles > 0, sube secuencialmente con delay (más estable)
   * @param uploads Array de objetos con filePath, buffer y contentType
   * @param delayBetweenFiles Delay opcional en ms entre cada archivo (por defecto 0)
   * @returns Array de resultados de las subidas
   */
  async uploadBuffersBatch(
    uploads: Array<{
      filePath: string;
      buffer: Buffer;
      contentType?: string;
    }>,
    delayBetweenFiles: number = 0
  ): Promise<
    Array<{
      filePath: string;
      ok: boolean;
      data: { fullPath: string; path: string } | null;
      error: string | null;
    }>
  > {
    // Si no hay delay, subir todos en paralelo (más rápido)
    if (delayBetweenFiles === 0) {
      const uploadPromises = uploads.map(
        async ({ filePath, buffer, contentType }) => {
          const result = await this.uploadBuffer(
            filePath,
            buffer,
            contentType || "image/png"
          );
          return { filePath, ...result };
        }
      );
      return Promise.all(uploadPromises);
    }

    // Si hay delay, subir secuencialmente (más estable)
    const results: Array<{
      filePath: string;
      ok: boolean;
      data: { fullPath: string; path: string } | null;
      error: string | null;
    }> = [];

    for (let i = 0; i < uploads.length; i++) {
      const { filePath, buffer, contentType } = uploads[i];

      const result = await this.uploadBuffer(
        filePath,
        buffer,
        contentType || "image/png"
      );

      results.push({ filePath, ...result });

      // Agregar delay entre archivos si no es el último
      if (i < uploads.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenFiles));
      }
    }

    return results;
  }
}
