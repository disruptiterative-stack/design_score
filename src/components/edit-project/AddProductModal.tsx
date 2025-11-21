import { useState } from "react";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";

interface AddProductModalProps {
  isOpen: boolean;
  productName: string;
  onNameChange: (name: string) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isAdding: boolean;
}

export function AddProductModal({
  isOpen,
  productName,
  onNameChange,
  onConfirm,
  onCancel,
  isAdding,
}: AddProductModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Agregar Producto
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              label="Nombre del Producto"
              value={productName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej: Silla Moderna"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Las imágenes se subirán después desde la opción de subir imágenes
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isAdding || !productName.trim()}>
              {isAdding ? "Agregando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
