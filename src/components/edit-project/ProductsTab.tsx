import { Product } from "@/src/domain/entities/Product";
import Button from "@/src/components/ui/Button";
import { ProductGallery } from "./ProductGallery";
import { ProductSelectionModal } from "./ProductSelectionModal";
import { ProductAdditionModal } from "./ProductAdditionModal";
import KeyShotXRViewer from "@/src/components/KeyShotXRViewer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getViewerBaseUrl } from "@/src/lib/getViewerBaseUrl";

interface ProductsTabProps {
  products: Product[];
  selectedProductIndex: number | null;
  isAddingProduct: boolean;
  selectedProductsToAdd: string[];
  onSelectProduct: (index: number) => void;
  onAddProduct: (productIds: string[]) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onOpenAddProductModal: () => void;
  onCloseAddProductModal: () => void;
  onSelectedProductsChange: (productIds: string[]) => void;
  isSaving: boolean;
  productAdditionModal: {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    success: boolean;
    productsCount: number;
  };
  onCloseProductAdditionModal: () => void;
}

export function ProductsTab({
  products,
  selectedProductIndex,
  isAddingProduct,
  // selectedProductsToAdd no se usa directamente aquí, pero se pasa al modal
  onSelectProduct,
  onAddProduct,
  onDeleteProduct,
  onOpenAddProductModal,
  onCloseAddProductModal,
  onSelectedProductsChange,
  isSaving,
  productAdditionModal,
  onCloseProductAdditionModal,
}: ProductsTabProps) {
  const router = useRouter();

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (selectedProductIndex !== null && selectedProductIndex >= 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProductIndex]);

  const handleConfirmAddProducts = async (productIds: string[]) => {
    await onAddProduct(productIds);
  };

  const existingProductIds = products.map((p) => p.product_id || p.id || "");

  return (
    <div>
      {/* Modal del Visor 3D */}
      {selectedProductIndex !== null &&
        selectedProductIndex >= 0 &&
        products[selectedProductIndex] &&
        products[selectedProductIndex].path && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center  bg-black/55 p-4"
            onClick={() => onSelectProduct(-1)}
          >
            <div
              className="relative w-full max-w-7xl  bg-white rounded-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-white text-black px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Vista 3D: {products[selectedProductIndex].name}
                </h3>
                <button
                  onClick={() => onSelectProduct(-1)}
                  className="text-neutral-500 border-1 border-transparent transition-colors p-1 rounded-lg hover:text-black hover:border-neutral-400"
                  title="Cerrar visor"
                >
                  <svg
                    className="w-9 h-9"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Visor 3D */}
              <div
                className="bg-white w-full flex items-center justify-center"
                style={{ height: "70vh" }}
              >
                <KeyShotXRViewer
                  baseUrl={getViewerBaseUrl(products[selectedProductIndex])}
                  config={products[selectedProductIndex].constants! as any}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

      {/* Encabezado con botón de agregar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Productos del Proyecto
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {products.length}{" "}
            {products.length === 1 ? "producto" : "productos"}
          </p>
        </div>
        <Button onClick={onOpenAddProductModal} disabled={isSaving}>
          <svg
            className="w-5 h-5 mr-2 inline-block"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Agregar Producto
        </Button>
      </div>

      {/* Galería de productos */}
      <ProductGallery
        products={products}
        onSelectProduct={onSelectProduct}
        onDeleteProduct={onDeleteProduct}
        isSaving={isSaving}
      />

      {/* Modal para agregar productos */}
      <ProductSelectionModal
        isOpen={isAddingProduct}
        onClose={onCloseAddProductModal}
        onConfirm={handleConfirmAddProducts}
        existingProductIds={existingProductIds}
        isAdding={isSaving}
      />

      {/* Modal de progreso de agregación */}
      <ProductAdditionModal
        isOpen={productAdditionModal.isOpen}
        isLoading={productAdditionModal.isLoading}
        error={productAdditionModal.error}
        success={productAdditionModal.success}
        productsCount={productAdditionModal.productsCount}
        onClose={onCloseProductAdditionModal}
      />

      {/* Botón para volver al Dashboard */}
      <div className="flex justify-start pt-6 mt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard")}
        >
          ← Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
