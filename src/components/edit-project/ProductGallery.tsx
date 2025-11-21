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
    <div className="flex flex-wrap gap-6 justify-start">
      {products.map((product, index) => (
        <ProductCard
          key={product.product_id || product.id}
          product={product}
          onView={() => onSelectProduct(index)}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
