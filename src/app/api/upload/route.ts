import { NextRequest } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { processZipFile } from "@/src/lib/fileProcessingServer";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";
import { SSEService } from "@/src/lib/sseService";
import { ImageUploadService } from "@/src/lib/uploadService";
import { FileValidationService } from "@/src/lib/fileValidationService";
import {
  checkRateLimit,
  getClientIP,
  getRateLimitKey,
  UPLOAD_RATE_LIMIT,
} from "@/src/lib/rateLimitService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/upload-rar-stream
 *
 * Sube un archivo ZIP/RAR con progreso en tiempo real usando Server-Sent Events
 */
export async function POST(request: NextRequest) {
  // Rate limiting - prevenir abuso
  const clientIP = getClientIP(request.headers);
  const rateLimitKey = getRateLimitKey(clientIP, "upload");
  const rateLimit = checkRateLimit(rateLimitKey, UPLOAD_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Demasiadas solicitudes. Por favor, espera antes de reintentar.",
        retryAfter: new Date(rateLimit.resetTime).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (rateLimit.resetTime - Date.now()) / 1000
          ).toString(),
          "X-RateLimit-Limit": UPLOAD_RATE_LIMIT.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
        },
      }
    );
  }

  // Validación de autenticación temprana
  const authCheck = await validateAuthentication();
  if (!authCheck.ok) {
    return authCheck.response;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sse = new SSEService(controller);

      try {
        await handleUploadStream(request, sse);
      } catch (error: any) {
        console.error("❌ Error en upload-rar-stream:", error);
        sse.sendError(error.message || "Error procesando archivo", error);
        sse.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Deshabilitar buffering en nginx/proxies
    },
  });
}

/**
 * Valida la autenticación del usuario
 */
async function validateAuthentication(): Promise<{
  ok: boolean;
  response?: Response;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Usuario no autenticado" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        ),
      };
    }

    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Error de autenticación: " + error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }
}

/**
 * Maneja el proceso completo de subida con streaming
 */
async function handleUploadStream(
  request: NextRequest,
  sse: SSEService
): Promise<void> {
  const supabase = await createClient();

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("❌ [upload-rar-stream] Usuario no autenticado");
    sse.sendError("Usuario no autenticado");
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
  const validationService = new FileValidationService();
  const uploadService = new ImageUploadService(storageRepository, {
    batchSize: 10,
    delayBetweenBatches: 350,
  });

  // Verificar Content-Type antes de parsear
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    sse.sendError("El request debe ser multipart/form-data");
    sse.close();
    return;
  }

  // Parsear formulario y validar con manejo de error
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (_err) {
    sse.sendError(
      "No se pudo parsear el formulario. Asegúrate de enviar un archivo usando FormData."
    );
    sse.close();
    return;
  }
  const file = formData.get("file") as File;
  const product_id = formData.get("product_id") as string;
  const admin_id = formData.get("admin_id") as string;

  // Validaciones
  const fileValidation = validationService.validateFileExists(file);
  if (!fileValidation.isValid) {
    sse.sendError(fileValidation.error!);
    sse.close();
    return;
  }

  const paramsValidation = validationService.validateRequiredParams({
    product_id,
    admin_id,
  });
  if (!paramsValidation.isValid) {
    sse.sendError(paramsValidation.error!);
    sse.close();
    return;
  }

  const extensionValidation = validationService.validateZipExtension(file.name);
  if (!extensionValidation.isValid) {
    sse.sendError(extensionValidation.error!);
    sse.close();
    return;
  }

  // Convertir File a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validar contenido ZIP
  const contentValidation = validationService.validateZipContent(buffer);
  if (!contentValidation.isValid) {
    sse.sendError(contentValidation.error!);
    sse.close();
    return;
  }

  sse.sendProgress("upload-complete", "Archivo recibido");

  // 1. Procesar archivo ZIP
  /*   console.log("🔄 [upload] Iniciando extracción de archivos..."); */
  sse.sendProgress("extracting", "Extrayendo archivos...");
  const { constants, imageFiles } = await processZipFile(buffer, false);
  /*   console.log(`✅ [upload] ${imageFiles.size} imágenes extraídas`); */
  sse.sendProgress("extracted", `${imageFiles.size} imágenes extraídas`, {
    imageCount: imageFiles.size,
  });

  // 2. Calcular tamaño total
  //const totalSizeMB = uploadService.calculateTotalSize(imageFiles);
  /*  console.log(
    `📊 [upload-rar-stream] Tamaño total de imágenes: ${totalSizeMB.toFixed(
      2
    )} MB`
  );
 */
  // 3. Subir imágenes con progreso
  const storagePath = `${admin_id}/${product_id}`;
  /*   console.log(`🔄 [upload] Iniciando subida de ${imageFiles.size} imágenes...`); */
  sse.sendProgress(
    "uploading-images",
    "Iniciando subida de imágenes a la base de datos...",
    {
      total: imageFiles.size,
      uploaded: 0,
    }
  );

  const uploadResult = await uploadService.uploadImages(
    imageFiles,
    storagePath,
    (progress) => {
      /*       console.log(
        `📊 [upload] Progreso: ${progress.uploadedCount}/${progress.total} - ${progress.percentage}%`
      ); */
      sse.sendProgress("uploading-images", progress.message, {
        fileName: progress.currentFileName,
        uploaded: progress.uploadedCount,
        total: progress.total,
        percentage: progress.percentage,
      });
    }
  );

  /*   console.log(
    `✅ [upload] Todas las imágenes subidas: ${uploadResult.uploadedImages.length}/${imageFiles.size}`
  ); */
  sse.sendProgress("images-uploaded", "Todas las imágenes subidas", {
    uploaded: uploadResult.uploadedImages.length,
    total: imageFiles.size,
  });

  // Reportar imágenes fallidas si las hay
  if (uploadResult.failedImages.length > 0) {
    console.warn(
      `⚠️ [upload-rar-stream] ${uploadResult.failedImages.length} imágenes fallaron:`,
      uploadResult.failedImages
    );
  }

  // 4. Actualizar producto
  sse.sendProgress(
    "updating-product",
    "Actualizando información del producto..."
  );

  const updateData: any = {
    constants: constants,
    path: uploadResult.storagePathUrl || storagePath,
    weight: uploadResult.totalSizeMB,
    updated_at: new Date().toISOString(),
  };

  if (uploadResult.coverImageUrl) {
    updateData.cover_image = uploadResult.coverImageUrl;
  }

  const { ok, error } = await productUseCase.updateProduct(
    product_id,
    updateData
  );

  if (!ok || error) {
    console.error("❌ [upload-rar-stream] Error actualizando producto:", error);
    sse.sendError(`Error actualizando producto: ${error}`);
    sse.close();
    return;
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
}
