import { useState, useEffect, useCallback, useRef } from "react";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";

interface PreloadProgress {
  totalProducts: number;
  loadedProducts: number;
  percentage: number;
  currentProduct: string;
}

interface PreloadedData {
  viewId: string;
  products: Product[];
}

// 🎯 Constantes de configuración
const CACHE_NAME = "keyshot-models-v1";
const CONCURRENT_PRODUCTS = 3; // Cargar 3 productos en paralelo
const COLUMNS_TO_PRELOAD = 9; // Reducido de 18 para carga más rápida
const TIMEOUT_PER_PRODUCT = 10000; // 10 segundos por producto

/**
 * Hook optimizado para pre-cargar modelos 3D con:
 * - ✅ Cache API para persistencia entre sesiones
 * - ✅ Carga paralela de productos (3 concurrentes)
 * - ✅ AbortController para cleanup y cancelación
 * - ✅ Reducción de imágenes precargadas (9 columnas vs 18)
 */
export function useModelPreloader(views: View[], allProducts: Product[][]) {
  const [isPreloading, setIsPreloading] = useState(true);
  const [progress, setProgress] = useState<PreloadProgress>({
    totalProducts: 0,
    loadedProducts: 0,
    percentage: 0,
    currentProduct: "",
  });
  const [preloadedData, setPreloadedData] = useState<Map<string, Product[]>>(
    new Map()
  );

  // ✅ MEJORA CRÍTICA #1: AbortController para cancelación
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * ✅ MEJORA CRÍTICA #2: Pre-carga con Cache API
   * Usa caché del navegador para persistir imágenes entre sesiones
   */
  const preloadImageWithCache = useCallback(
    async (src: string): Promise<boolean> => {
      try {
        // Intentar usar Cache API
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(src);

        if (cached) {
          // Cache hit - no necesita descargar
          return true;
        }

        // Cache miss - descargar y cachear
        const response = await fetch(src, {
          signal: abortControllerRef.current?.signal,
        });

        if (response.ok) {
          await cache.put(src, response.clone());
          return false; // Descargado (no en caché)
        }

        return false;
      } catch (error: any) {
        // Ignorar errores de abort
        if (error.name === "AbortError") {
          return false;
        }

        // Fallback a método tradicional si Cache API falla
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(false);
          img.onerror = () => resolve(false);
          img.src = src;
        });
      }
    },
    []
  );

  /**
   * Pre-carga las imágenes clave de un producto
   * Reducido a 9 columnas para carga más rápida
   */
  const preloadProductImages = useCallback(
    async (product: Product): Promise<void> => {
      if (!product.path || !product.constants) {
        return;
      }

      const config = product.constants as any;
      const uCount = config.uCount || 36;
      const vCount = config.vCount || 5;
      const ext = config.imageExtension || "png";

      // ✅ Reducido a 9 columnas (50% menos que antes)
      const imagesToPreload: string[] = [];
      const columnsToPreload = Math.min(uCount, COLUMNS_TO_PRELOAD);

      for (let v = 0; v < vCount; v++) {
        for (let u = 0; u < columnsToPreload; u++) {
          imagesToPreload.push(`${product.path}/${v}_${u}.${ext}`);
        }
      }

      if (imagesToPreload.length === 0) {
        return;
      }

      // Pre-cargar todas las imágenes en paralelo
      const startTime = performance.now();

      await Promise.race([
        // Precargar todas las imágenes
        Promise.all(imagesToPreload.map((src) => preloadImageWithCache(src))),

        // Timeout de seguridad
        new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn(
              `⏱️ Timeout pre-cargando ${product.name || "producto"}`
            );
            resolve();
          }, TIMEOUT_PER_PRODUCT);
        }),
      ]);

      /*       const duration = performance.now() - startTime; */
      /*       console.log(
        `📦 ${product.name || "Producto"}: ${duration.toFixed(0)}ms (${
          imagesToPreload.length
        } imgs)`
      ); */
    },
    [preloadImageWithCache]
  );

  /**
   * ✅ MEJORA CRÍTICA #3: Pre-carga todos los productos con carga PARALELA
   * Carga 3 productos simultáneamente en lugar de secuencialmente
   */
  const preloadAllProducts = useCallback(async () => {
    if (views.length === 0 || allProducts.length === 0) {
      setIsPreloading(false);
      return;
    }

    // ✅ Crear nuevo AbortController para esta sesión
    abortControllerRef.current = new AbortController();

    const totalProducts = allProducts.reduce(
      (sum, products) => sum + products.length,
      0
    );

    /*  console.log(`🚀 Iniciando precarga de ${totalProducts} productos...`); */
    const overallStartTime = performance.now();

    setProgress({
      totalProducts,
      loadedProducts: 0,
      percentage: 0,
      currentProduct: "",
    });

    let loadedCount = 0;
    const preloadedMap = new Map<string, Product[]>();

    try {
      // Pre-cargar productos vista por vista
      for (let i = 0; i < views.length; i++) {
        // ✅ Verificar si fue cancelado
        if (abortControllerRef.current?.signal.aborted) {
          /*       console.log("🛑 Precarga cancelada por usuario"); */
          break;
        }

        const view = views[i];
        const products = allProducts[i];

        if (!view.view_id || !products) continue;

        // ✅ CARGA PARALELA: Procesar en lotes de 3 productos
        for (let j = 0; j < products.length; j += CONCURRENT_PRODUCTS) {
          // Verificar cancelación antes de cada lote
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const batch = products.slice(j, j + CONCURRENT_PRODUCTS);

          // Actualizar UI con el primer producto del lote
          setProgress((prev) => ({
            ...prev,
            currentProduct: batch[0]?.name || "Cargando...",
          }));

          // ⚡ CARGAR 3 PRODUCTOS EN PARALELO
          await Promise.all(
            batch.map((product) => preloadProductImages(product))
          );

          // Actualizar progreso después del lote
          loadedCount += batch.length;
          const percentage = Math.round((loadedCount / totalProducts) * 100);

          setProgress({
            totalProducts,
            loadedProducts: loadedCount,
            percentage,
            currentProduct: batch[batch.length - 1]?.name || "",
          });
        }

        // Guardar productos de esta vista
        preloadedMap.set(view.view_id, products);
      }

      setPreloadedData(preloadedMap);

      /*  const totalDuration = performance.now() - overallStartTime; */
      /* console.log(
        `✅ Precarga completada: ${loadedCount}/${totalProducts} productos en ${(
          totalDuration / 1000
        ).toFixed(1)}s`
      ); */
    } catch (error) {
      console.error("❌ Error en precarga:", error);
    } finally {
      setIsPreloading(false);
    }
  }, [views, allProducts, preloadProductImages]);

  // Iniciar pre-carga cuando cambien las vistas o productos
  useEffect(() => {
    if (views.length > 0 && allProducts.length > 0) {
      setIsPreloading(true);
      preloadAllProducts();
    }

    // ✅ CLEANUP: Cancelar descargas al desmontar componente
    return () => {
      if (abortControllerRef.current) {
        /*         console.log("🧹 Limpiando precarga - cancelando descargas...");
         */ abortControllerRef.current.abort();
      }
    };
  }, [views, allProducts, preloadAllProducts]);

  return {
    isPreloading,
    progress,
    preloadedData,
  };
}
