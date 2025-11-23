import { Product } from "@/src/domain/entities/Product";
import ProductCard from "@/src/components/ProductCard";

interface ProductGalleryProps {
  products: Product[];
  onSelectProduct: (index: number) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  isSaving: boolean;
}

export function ProductGallery({
  products,
  onSelectProduct,
  onDeleteProduct,
  isSaving,
}: ProductGalleryProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 mb-2">No hay productos en este proyecto</p>
        <p className="text-gray-500 text-sm">Agrega productos para comenzar</p>
      </div>
    );
  }

  const handleDelete = async (productId: string) => {
    if (isSaving) return;
    await onDeleteProduct(productId);
  };

  return (
    <div className="max-h-[25rem] overflow-y-auto border border-gray-200 rounded-lg p-4 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={product.product_id || product.id}
            product={product}
            onView={() => onSelectProduct(index)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
