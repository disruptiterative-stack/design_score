import { Product } from "@/src/domain/entities/Product";
import Image from "next/image";
import { useState } from "react";
import EditProductNameModal from "@/src/components/EditProductNameModal";

interface ProductCardProps {
  product: Product;
  onView?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onSelect?: (productId: string) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  onNameUpdated?: () => void; // Callback cuando se actualiza el nombre
}

export default function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  selectionMode = false,
  onNameUpdated,
}: ProductCardProps) {
  const productId = product.product_id || product.id || "";
  const weight = product.weight || 0;
  const [imageError, setImageError] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  // Validar que cover_image sea una imagen válida (no un ZIP)
  const isValidCoverImage =
    product.cover_image &&
    !product.cover_image.toLowerCase().endsWith(".zip") &&
    !product.cover_image.toLowerCase().endsWith(".rar") &&
    !imageError;

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 max-h-[18em] w-[15em] ${
        isSelected ? "ring-4 ring-gray-400" : "border-gray-300"
      }`}
    >
      {/* Preview Image */}
      <div className="relative h-32 bg-gray-100">
        {isValidCoverImage ? (
          <Image
            src={product.cover_image!}
            alt={product.name}
            fill
            className="object-cover"
            sizes="16em"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <CubeIcon />
          </div>
        )}
        {selectionMode && (
          <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(productId)}
              className="w-6 h-6 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between h-[calc(100%-8rem)] gap-2">
        <div>
          {/* Título sin botón de editar */}
          <h3 className="text-lg text-center font-medium text-gray-800 mb-2 truncate">
            {product.name}
          </h3>

          <div className="flex flex-col text-center gap-1 text-sm text-gray-600">
            {!selectionMode && <span>{weight.toFixed(2)} MB</span>}
            {/*        {product.num_images !== undefined && (
              <span>🖼️ Imágenes: {product.num_images}</span>
            )} */}
          </div>
        </div>

        {/* Actions */}
        {!selectionMode && (
          <div className="flex gap-2 justify-center mt-3">
            {onView && (
              <button
                onClick={() => onView(productId)}
                className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-black text-white rounded transition-colors"
                title="Ver"
              >
                <EyeIcon />
              </button>
            )}
            {/* Botón de editar nombre */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditNameModalOpen(true);
              }}
              className="flex items-center justify-center w-10 h-10 bg-neutral-600 hover:bg-neutral-700 text-white rounded transition-colors"
              title="Editar nombre"
            >
              <PencilIcon />
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(productId)}
                className="flex items-center justify-center w-10 h-10 bg-neutral-600 hover:bg-neutral-800 text-white rounded transition-colors"
                title="Editar"
              >
                <EditIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(productId)}
                className="flex items-center justify-center w-10 h-10 bg-gray-400 hover:bg-gray-600 text-white rounded transition-colors"
                title="Eliminar"
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de edición de nombre */}
      <EditProductNameModal
        isOpen={isEditNameModalOpen}
        productId={productId}
        currentName={product.name}
        onClose={() => setIsEditNameModalOpen(false)}
        onSuccess={() => {
          // Recargar datos si se proporciona el callback
          onNameUpdated?.();
        }}
      />
    </div>
  );
}

// Icons
function CubeIcon() {
  return (
    <svg
      className="w-12 h-12"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}
