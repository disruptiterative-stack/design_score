"use client";

import { useState } from "react";

interface DeleteProductModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  productId: string | null; // Agregamos esto para usar como key
}

export default function DeleteProductModal({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      // Si llegamos aquí, la eliminación fue exitosa
      // Resetear estados antes de cerrar
      setIsDeleting(false);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al eliminar el producto");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError(null);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-slideUp">
        {!isDeleting && !error ? (
          <>
            <h2 className="text-xl font-medium text-gray-800 mb-4">
              ¿Eliminar Producto?
            </h2>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. El producto será eliminado
              permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Eliminar
              </button>
            </div>
          </>
        ) : isDeleting ? (
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              Eliminando producto...
            </h2>
            <p className="text-gray-600 text-sm">Por favor espera un momento</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center">
              <svg
                className="w-12 h-12 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              Error al eliminar
            </h2>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
