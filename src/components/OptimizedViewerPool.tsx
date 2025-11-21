"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import KeyShotXRViewer, {
  KeyShotXRConfig,
} from "@/src/components/KeyShotXRViewer";
import SyncToggle from "@/src/components/SyncToggle";
import { Product } from "@/src/domain/entities/Product";
import { getViewerBaseUrl } from "@/src/lib/getViewerBaseUrl";

interface OptimizedViewerPoolProps {
  currentProducts: Product[];
  nextProducts?: Product[];
  currentViewIndex: number;
  gridCols: 1 | 2 | 3 | 4;
}
export default function OptimizedViewerPool({
  currentProducts,
  nextProducts = [],
  currentViewIndex,
  gridCols,
}: OptimizedViewerPoolProps) {
  const [isSynced, setIsSynced] = useState(false);
  const [iframesReady, setIframesReady] = useState(0); // Contador para forzar re-render
  const hasMultipleProducts = currentProducts.length > 1;
  const iframesRef = useRef<Map<string, HTMLIFrameElement>>(new Map());

  // Resetear solo el estado de sincronización cuando cambia la vista
  // NO limpiar iframesRef aquí porque los iframes nuevos se registrarán automáticamente
  useEffect(() => {
    setIsSynced(false);
  }, [currentViewIndex]);

  // Sincronización mediante monitoreo de índices de KeyShotXR
  useEffect(() => {
    // Esperar a que haya al menos un iframe listo antes de procesar
    const hasIframes = iframesRef.current.size > 0;

    // Si no hay iframes listos, no hacer nada
    if (!hasIframes) {
      return;
    }

    const sendSyncState = (enabled: boolean) => {
      const iframeCount = iframesRef.current.size;
      if (iframeCount === 0) return;

      iframesRef.current.forEach((iframe, _productId) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "keyshot-sync-enable",
              enabled: enabled,
            },
            "*"
          );
        }
      });
    };

    if (!isSynced || !hasMultipleProducts) {
      if (hasIframes) {
        sendSyncState(false);
      }
      return;
    }

    if (!hasIframes) return;

    sendSyncState(true);

    const retryTimeout = setTimeout(() => {
      sendSyncState(true);
    }, 500);

    const handlePointerEvent = (event: MessageEvent) => {
      if (event.data.type === "keyshot-pointer-event") {
        const {
          containerId,
          eventType,
          relativeX,
          relativeY,
          buttons,
          button,
        } = event.data;

        iframesRef.current.forEach((iframe, _productId) => {
          if (_productId === containerId) return;

          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-pointer-event",
                eventType: eventType,
                containerId: containerId,
                relativeX: relativeX,
                relativeY: relativeY,
                buttons: buttons,
                button: button,
              },
              "*"
            );
          }
        });

        return;
      }

      // 🔄 SINCRONIZACIÓN DE ZOOM: Manejar eventos de rueda del mouse
      if (event.data.type === "keyshot-wheel-event") {
        const { containerId, direction } = event.data;

        iframesRef.current.forEach((iframe, _productId) => {
          if (_productId === containerId) return;

          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-wheel-event",
                containerId: containerId,
                direction: direction,
              },
              "*"
            );
          }
        });

        return;
      }

      if (
        event.data.type === "keyshot-mouse-down" ||
        event.data.type === "keyshot-mouse-move" ||
        event.data.type === "keyshot-mouse-up"
      ) {
        const { containerId, relativeX, relativeY } = event.data;

        iframesRef.current.forEach((iframe, _productId) => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: event.data.type,
                containerId: containerId,
                relativeX: relativeX,
                relativeY: relativeY,
              },
              "*"
            );
          }
        });

        return;
      }

      if (event.data.type === "keyshot-mouse-sync") {
        const { containerId, relativeX, relativeY, isMouseDown } = event.data;

        iframesRef.current.forEach((iframe, _productId) => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-mouse-sync",
                containerId: containerId,
                relativeX,
                relativeY,
                isMouseDown,
              },
              "*"
            );
          }
        });

        return;
      }

      if (event.data.type === "keyshot-index-changed") {
        const { containerId, uIndex, vIndex } = event.data;

        iframesRef.current.forEach((iframe, _productId) => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-sync-indices",
                containerId: containerId,
                uIndex,
                vIndex,
              },
              "*"
            );
          }
        });
      }
    };

    window.addEventListener("message", handlePointerEvent);

    return () => {
      clearTimeout(retryTimeout);
      window.removeEventListener("message", handlePointerEvent);
    };
  }, [isSynced, hasMultipleProducts, iframesReady, currentProducts.length]);

  const currentViewers = useMemo(() => {
    return currentProducts.map((product, index) => {
      return {
        product,
        index,
      };
    });
  }, [currentProducts]);

  const nextViewers = useMemo(() => {
    return nextProducts.map((product) => {
      return {
        product,
      };
    });
  }, [nextProducts]);

  // Mapeo de gridCols a clases de Tailwind
  const gridClass =
    gridCols === 1
      ? "grid-cols-1"
      : gridCols === 2
      ? "grid-cols-2"
      : gridCols === 3
      ? "grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

  // Utilidad para obtener la URL base del visor

  return (
    <>
      {/* Botón de sincronización */}
      {hasMultipleProducts && (
        <SyncToggle isSynced={isSynced} onToggle={setIsSynced} />
      )}

      <div className={`grid gap-4 h-full w-full ${gridClass} bg-white`}>
        {currentViewers.map(({ product }) => {
          const baseUrl = getViewerBaseUrl(product);
          return (
            <div
              key={`container-${product.product_id}-${currentViewIndex}`}
              className={`relative w-full h-full rounded-lg overflow-hidden transition-all duration-300 ${
                isSynced && hasMultipleProducts
                  ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
                  : ""
              }`}
            >
              {/* Visor 360 centrado y con tamaño contenido */}
              {baseUrl && product.constants ? (
                <div className="w-full h-full relative">
                  {/* Indicador de sincronización/bloqueo */}
                  {isSynced && hasMultipleProducts && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                      {/* Pulso animado de fondo */}
                      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>

                      {/* Badge principal */}
                      <div className="relative bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Sincronizado</span>
                      </div>
                    </div>
                  )}

                  <div className={`relative w-full h-full`}>
                    <KeyShotXRViewer
                      key={product.product_id}
                      baseUrl={baseUrl}
                      config={product.constants as unknown as KeyShotXRConfig}
                      className="w-full h-full"
                      viewerId={product.product_id!}
                      onIframeReady={(iframe) => {
                        if (iframe) {
                          iframesRef.current.set(product.product_id!, iframe);
                          setIframesReady((prev) => prev + 1);
                        } else {
                          iframesRef.current.delete(product.product_id!);
                          setIframesReady((prev) => Math.max(0, prev - 1));
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  Sin vista 360
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visores precargados ocultos para la siguiente vista */}
      <div className="hidden">
        {nextViewers.map(({ product }) => {
          const baseUrl = getViewerBaseUrl(product);
          return (
            <div key={`preload-${product.product_id}`}>
              {baseUrl && product.constants && (
                <KeyShotXRViewer
                  key={product.product_id}
                  baseUrl={baseUrl}
                  config={product.constants as unknown as KeyShotXRConfig}
                  className="w-full h-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
