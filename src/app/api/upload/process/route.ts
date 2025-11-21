import { NextRequest } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { processZipFile } from "@/src/lib/fileProcessingServer";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";
import { SSEService } from "@/src/lib/sseService";
import { ImageUploadService } from "@/src/lib/uploadService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos

/**
 * POST /api/upload/process
 * 
 * Procesa un archivo ZIP que ya fue subido a Supabase Storage
 * Esto evita el límite de 4.5MB de Vercel para el body
 */
export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const sse = new SSEService(controller);

      try {
        await handleProcessZip(request, sse);
      } catch (error: unknown) {
        const err = error as Error;
        console.error("❌ Error en upload/process:", err);
        sse.sendError(err.message || "Error procesando archivo");
        sse.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function handleProcessZip(
  request: NextRequest,
  sse: SSEService
): Promise<void> {
  const supabase = await createClient();

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    sse.sendError("Usuario no autenticado");
    sse.close();
    return;
  }

  // Parsear JSON body
  const body = await request.json();
  const { zipPath, product_id, admin_id } = body;

  if (!zipPath || !product_id || !admin_id) {
    sse.sendError("Faltan parámetros requeridos");
    sse.close();
    return;
  }

  // Verificar que el usuario es el propietario
  if (user.id !== admin_id) {
    sse.sendError("No autorizado");
    sse.close();
    return;
  }

  // Inicializar servicios
  const storageRepository = new SupabaseStorageRepository(supabase);
  const productRepository = new SupabaseProductRepository(
    supabase,
    storageRepository
  );
  const productUseCase = new ProductUseCase(productRepository);
  const uploadService = new ImageUploadService(storageRepository, {
    batchSize: 12,
    delayBetweenBatches: 350,
  });

  try {
    // 1. Descargar el archivo ZIP desde Supabase Storage
    sse.sendProgress("downloading", "Descargando archivo desde storage...");
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("files")
      .download(zipPath);

    if (downloadError || !fileData) {
      throw new Error(`Error descargando archivo: ${downloadError?.message}`);
    }

    // Convertir Blob a Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    sse.sendProgress("download-complete", "Archivo descargado");

    // 2. Procesar archivo ZIP
    sse.sendProgress("extracting", "Extrayendo archivos...");
    const { constants, imageFiles } = await processZipFile(buffer, false);
    sse.sendProgress("extracted", `${imageFiles.size} imágenes extraídas`, {
      imageCount: imageFiles.size,
    });

    // 3. Subir imágenes con progreso
    const storagePath = `${admin_id}/${product_id}`;
    sse.sendProgress(
      "uploading-images",
      "Iniciando subida de imágenes...",
      {
        total: imageFiles.size,
        uploaded: 0,
      }
    );

    const uploadResult = await uploadService.uploadImages(
      imageFiles,
      storagePath,
      (progress) => {
        sse.sendProgress("uploading-images", progress.message, {
          fileName: progress.currentFileName,
          uploaded: progress.uploadedCount,
          total: progress.total,
          percentage: progress.percentage,
        });
      }
    );

    sse.sendProgress("images-uploaded", "Todas las imágenes subidas", {
      uploaded: uploadResult.uploadedImages.length,
      total: imageFiles.size,
    });

    // 4. Actualizar producto
    sse.sendProgress(
      "updating-product",
      "Actualizando información del producto..."
    );

    const updateData = {
      constants: constants,
      path: uploadResult.storagePathUrl || storagePath,
      weight: uploadResult.totalSizeMB,
      updated_at: new Date().toISOString(),
      ...(uploadResult.coverImageUrl && {
        cover_image: uploadResult.coverImageUrl,
      }),
    };

    const { ok, error } = await productUseCase.updateProduct(
      product_id,
      updateData
    );

    if (!ok || error) {
      throw new Error(`Error actualizando producto: ${error}`);
    }

    // Enviar resultado final
    sse.sendComplete("Procesamiento completado", {
      constants,
      uploadedImages: uploadResult.uploadedImages,
      imageCount: imageFiles.size,
      storagePath: uploadResult.storagePathUrl || storagePath,
      coverImage: uploadResult.coverImageUrl,
      totalSizeMB: parseFloat(uploadResult.totalSizeMB.toFixed(2)),
      failedImages: uploadResult.failedImages,
    });

    sse.close();
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ Error procesando ZIP:", err);
    sse.sendError(err.message || "Error procesando archivo");
    sse.close();
  }
}
