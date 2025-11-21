"use client";

import { useState, useEffect } from "react";
import { Product } from "@/src/domain/entities/Product";
import { getProductByIdAction } from "@/src/app/actions/productActions";
import KeyShotXRViewer from "./KeyShotXRViewer";
import { getViewerBaseUrl } from "../lib/getViewerBaseUrl";

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

export default function ViewProductModal({
  isOpen,
  onClose,
  productId,
}: ViewProductModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct();
    } else {
      setProduct(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId]);

  const loadProduct = async () => {
    if (!productId) return;

    try {
      setIsLoading(true);
      const fetchedProduct = await getProductByIdAction(productId);
      setProduct(fetchedProduct);
    } catch (error) {
      console.error("Error cargando producto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
          <div className="w-full text-center">
            <h2 className="text-center text-2xl font-light text-gray-800">
              {product?.name || "Cargando..."}
            </h2>
            {/*        {product?.description && (
              <p className="text-sm text-gray-500 mt-1">
                {product.description}
              </p>
            )} */}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            title="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-b-xl">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
              <div className="text-gray-600 font-medium">
                Cargando modelo 3D...
              </div>
            </div>
          ) : product && product.path ? (
            <div className="w-full h-full p-4">
              <div className="w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                <KeyShotXRViewer
                  config={
                    typeof product.constants === "string"
                      ? JSON.parse(product.constants)
                      : (product.constants as Record<string, unknown>)
                  }
                  baseUrl={getViewerBaseUrl(product)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <svg
                className="w-24 h-24 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-1">
                  {!product
                    ? "No se pudo cargar el producto"
                    : "Visor 3D no disponible"}
                </div>
                <div className="text-gray-400 text-sm">
                  {!product
                    ? "Intenta nuevamente más tarde"
                    : "Este producto no tiene un modelo 3D asociado"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
