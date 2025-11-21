"use client";

import { useState, useEffect } from "react";
import { Product } from "@/src/domain/entities/Product";
import ProductCard from "./ProductCard";

interface ProductGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsSelected: (productIds: string[]) => void;
  maxSelection?: number;
}

export default function ProductGalleryModal({
  isOpen,
  onClose,
  products,
  onProductsSelected,
  maxSelection,
}: ProductGalleryModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProducts(new Set());
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        if (maxSelection && newSet.size >= maxSelection) {
          alert(`Solo puedes seleccionar hasta ${maxSelection} productos`);
          return prev;
        }
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onProductsSelected(Array.from(selectedProducts));
    onClose();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-gray-800">
              Seleccionar Productos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
            />
            <SearchIcon />
          </div>

          <div className="mt-3 text-sm text-gray-600">
            {selectedProducts.size} producto(s) seleccionado(s)
            {maxSelection && ` de ${maxSelection} máximo`}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              {searchTerm
                ? "No se encontraron productos con ese nombre"
                : "No hay productos disponibles"}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.product_id || product.id}
                  product={product}
                  selectionMode={true}
                  isSelected={selectedProducts.has(
                    product.product_id || product.id || ""
                  )}
                  onSelect={handleToggleProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedProducts.size === 0}
            className="px-6 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar ({selectedProducts.size})
          </button>
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

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
