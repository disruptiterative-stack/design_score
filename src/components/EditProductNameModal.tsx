"use client";

import { useState, useEffect } from "react";
import { updateProductAction } from "@/src/app/actions/productActions";
import Button from "@/src/components/ui/Button";

interface EditProductNameModalProps {
  isOpen: boolean;
  productId: string;
  currentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductNameModal({
  isOpen,
  productId,
  currentName,
  onClose,
  onSuccess,
}: EditProductNameModalProps) {
  const [productName, setProductName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar el nombre cuando cambie el prop currentName
  useEffect(() => {
    setProductName(currentName);
    setError(null);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = productName.trim();

    if (!trimmedName) {
      setError("El nombre del producto no puede estar vacío");
      return;
    }

    if (trimmedName === currentName) {
      // No hay cambios
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await updateProductAction(productId, {
        name: trimmedName,
      });

      if (!result.ok) {
        throw new Error(result.error || "Error al actualizar el producto");
      }

      // Éxito
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error al actualizar nombre del producto:", error);
      setError(error.message || "Error al actualizar el nombre");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProductName(currentName);
      setError(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
      // Removido el onClick para que no cierre al hacer click fuera
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        // Removido el onKeyDown para que no cierre con ESC
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Editar Nombre del Producto
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Producto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-800 focus:border-transparent text-gray-800"
              placeholder="Ej: Silla Moderna 2024"
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              variant="primary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !productName.trim()}
              variant="secondary"
              isLoading={isSubmitting}
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
