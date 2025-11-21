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

      // Eliminar todos los archivos en lotes grandes para mayor velocidad
      const batchSize = 200; // Aumentado de 50 a 200 para mayor velocidad
      /*       let totalDeleted = 0; */

      // Crear promesas para eliminar múltiples lotes en paralelo (máximo 3 a la vez)
      const maxParallelBatches = 3;
      const deletionPromises: Promise<void>[] = [];

      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);

        const deletionPromise = (async () => {
          const { error: deleteError } = await this.supabaseClient.storage
            .from("files")
            .remove(batch);

          if (deleteError) {
            console.error(
              `❌ Error eliminando lote de ${batch.length} archivos:`,
              deleteError.message
            );
          }
        })();

        deletionPromises.push(deletionPromise);

        // Ejecutar en lotes de promesas paralelas para evitar saturar
        if (deletionPromises.length >= maxParallelBatches) {
          await Promise.allSettled(deletionPromises);
          deletionPromises.length = 0; // Limpiar el array
        }
      }

      // Ejecutar las promesas restantes
      if (deletionPromises.length > 0) {
        await Promise.allSettled(deletionPromises);
      }

      // Verificar si quedan archivos (opcional, eliminar para mayor velocidad)
      // Si confías en que la eliminación funcionó, puedes comentar esta sección
      const remainingFiles = await this.listAllFilesRecursively(folderPath);

      if (remainingFiles.length > 0) {
        console.warn(
          `⚠️  Quedan ${remainingFiles.length} archivos sin eliminar, reintentando...`
        );
        // Intentar eliminar los archivos restantes de nuevo en un solo lote
        const { error: retryError } = await this.supabaseClient.storage
          .from("files")
          .remove(remainingFiles.slice(0, 200)); // Limitar a 200 en el reintento

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
   * Lista todos los archivos en una carpeta recursivamente con paginación optimizada
   */
  private async listAllFilesRecursively(
    folderPath: string,
    accumulated: string[] = []
  ): Promise<string[]> {
    const limit = 1000;

    // Primera llamada para obtener el total aproximado
    const { data: initialFiles, error: listError } =
      await this.supabaseClient.storage.from("files").list(folderPath, {
        limit,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (listError) {
      console.error(`❌ Error listando carpeta ${folderPath}:`, listError);
      return accumulated;
    }

    if (!initialFiles || initialFiles.length === 0) {
      return accumulated;
    }

    // Procesar primera página
    const folderPromises: Promise<void>[] = [];

    for (const file of initialFiles) {
      const fullPath = `${folderPath}/${file.name}`;

      if (file.id) {
        // Es un archivo
        accumulated.push(fullPath);
      } else {
        // Es una carpeta, explorar recursivamente en paralelo
        folderPromises.push(
          this.listAllFilesRecursively(fullPath, accumulated).then(() => {})
        );
      }
    }

    // Si hay más páginas, procesarlas en paralelo
    if (initialFiles.length === limit) {
      const pagePromises: Promise<void>[] = [];

      // Estimar cuántas páginas más pueden haber (máximo 10 en paralelo)
      for (let offset = limit; offset < limit * 10; offset += limit) {
        pagePromises.push(
          (async () => {
            const { data: files, error } = await this.supabaseClient.storage
              .from("files")
              .list(folderPath, {
                limit,
                offset,
                sortBy: { column: "name", order: "asc" },
              });

            if (error || !files || files.length === 0) {
              return;
            }

            for (const file of files) {
              const fullPath = `${folderPath}/${file.name}`;

              if (file.id) {
                accumulated.push(fullPath);
              } else {
                await this.listAllFilesRecursively(fullPath, accumulated);
              }
            }
          })()
        );
      }

      await Promise.allSettled(pagePromises);
    }

    // Esperar a que todas las carpetas se procesen
    await Promise.allSettled(folderPromises);

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
