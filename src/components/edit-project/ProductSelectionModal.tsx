"use client";

import { useState, useEffect } from "react";
import { Product } from "@/src/domain/entities/Product";
import { getAllProductsAction } from "@/src/app/actions/productActions";
import ProductCard from "@/src/components/ProductCard";
import Button from "@/src/components/ui/Button";
import AddProductDialog from "@/src/components/dashboard/AddProductDialog";
import UploadProgressModal from "@/src/components/dashboard/UploadProgressModal";
import { useProductUpload } from "@/src/hooks/useProductUpload";
import { useProducts } from "@/src/hooks/useProducts";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (productIds: string[]) => Promise<void>;
  existingProductIds?: string[];
  isAdding: boolean;
}

export function ProductSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  existingProductIds = [],
  isAdding,
}: ProductSelectionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const { uploadState, uploadProduct, startUpload } = useProductUpload();
  const productsHook = useProducts();

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await getAllProductsAction();
      // Ordenar por fecha de creación (más reciente primero)
      const sortedProducts = fetchedProducts.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Orden descendente
      });
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (
    name: string,
    description: string,
    files: FileList
  ) => {
    if (files.length === 0 || !files[0].name.endsWith(".zip")) {
      alert("Debes seleccionar un archivo ZIP");
      return;
    }

    const zipFile = files[0];

    try {
      // Cerrar el modal de creación Y mostrar inmediatamente el modal de progreso
      setIsAddProductModalOpen(false);
      startUpload(); // Esto mostrará el UploadProgressModal inmediatamente

      // 1. Crear el producto en la base de datos
      const result = await productsHook.createProduct(name, description, []);

      if (!result.ok || !result.product) {
        throw new Error(result.error || "Error al crear producto");
      }

      const productId = result.product.product_id || result.product.id;
      if (!productId) {
        throw new Error("No se obtuvo el ID del producto");
      }

      // 2. Subir el archivo ZIP usando el hook
      const uploadResult = await uploadProduct(productId, zipFile);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Error al subir el archivo");
      }

      // 3. Recargar productos
      await loadProducts();
      await productsHook.refreshProducts();
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error creando producto:", err);
      alert(`Error al crear producto: ${err.message}`);
    }
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleConfirm = async () => {
    if (selectedProducts.size === 0) {
      alert("Debes seleccionar al menos un producto");
      return;
    }
    await onConfirm(Array.from(selectedProducts));
    setSelectedProducts(new Set());
    setSearchTerm("");
  };

  const handleCancel = () => {
    setSelectedProducts(new Set());
    setSearchTerm("");
    onClose();
  };

  // Filtrar productos que no estén ya en el proyecto
  const availableProducts = products.filter(
    (product) =>
      !existingProductIds.includes(product.product_id || product.id || "")
  );

  const filteredProducts = availableProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-light text-gray-800">
            Selecciona Productos para Agregar
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="text-gray-600">Cargando productos...</div>
            </div>
          ) : (
            <>
              {/* Search Bar y Botón Nuevo Producto */}
              <div className="flex gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar productos por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-black px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                  />
                  <SearchIcon />
                </div>

                {/* Botón Nuevo Producto */}
                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-5 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <PlusIcon />
                  <span>Nuevo Producto</span>
                </button>
              </div>

              {/* Selected Count */}
              <div className="mb-4 text-sm text-gray-600">
                {selectedProducts.size} producto(s) seleccionado(s)
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  {searchTerm
                    ? "No se encontraron productos con ese nombre"
                    : availableProducts.length === 0
                    ? "Todos los productos disponibles ya están en este proyecto"
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
                      onNameUpdated={loadProducts}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isAdding}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            disabled={selectedProducts.size === 0 || isAdding}
          >
            {isAdding ? "Agregando..." : `Agregar (${selectedProducts.size})`}
          </Button>
        </div>
      </div>

      {/* Modales */}
      <AddProductDialog
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSubmit={handleCreateProduct}
      />

      <UploadProgressModal
        isOpen={uploadState.isUploading}
        progress={uploadState.progress}
        message={uploadState.message}
        filesUploaded={uploadState.filesUploaded}
        totalFiles={uploadState.totalFiles}
        currentFileName={uploadState.currentFileName}
        phase={uploadState.phase}
      />
    </div>
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

function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}
