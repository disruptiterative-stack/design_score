import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/src/components/ui/Button";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { ViewCreationModal } from "./ViewCreationModal";
import { ViewDeletionModal } from "./ViewDeletionModal";

interface ViewsTabProps {
  views: View[];
  products: Product[];
  viewProducts: Record<string, string[]>;
  onToggleProduct: (viewId: string, productId: string) => Promise<void>;
  onAddView: () => Promise<void>;
  onDeleteView: (viewId: string) => void;
  viewCreationModal: {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    success: boolean;
  };
  onCloseViewCreationModal: () => void;
  viewDeletionModal: {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    success: boolean;
    viewId: string | null;
    viewName: string;
  };
  onConfirmDeleteView: () => void;
  onCancelDeleteView: () => void;
  onCloseViewDeletionModal: () => void;
  onUpdateViewName: (viewId: string, newName: string) => Promise<void>;
}

export function ViewsTab({
  views,
  products,
  viewProducts,
  onToggleProduct,
  onAddView,
  onDeleteView,
  viewCreationModal,
  onCloseViewCreationModal,
  viewDeletionModal,
  onConfirmDeleteView,
  onCancelDeleteView,
  onCloseViewDeletionModal,
  onUpdateViewName,
}: ViewsTabProps) {
  const router = useRouter();
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Ordenar productos por fecha de creación (más reciente primero)
  const sortedProducts = [...products].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // Orden descendente (más reciente primero)
  });

  const handleStartEdit = (view: View) => {
    setEditingViewId(view.view_id!);
    setEditingName(view.name || "Nueva vista");
  };

  const handleSaveEdit = async (viewId: string) => {
    if (editingName.trim()) {
      try {
        await onUpdateViewName(viewId, editingName.trim());
        setEditingViewId(null);
        setEditingName("");
      } catch (error) {
        const err = error as Error;
        alert(`❌ Error al actualizar nombre: ${err.message}`);
        // No cerrar el modo de edición para permitir al usuario corregir
      }
    } else {
      setEditingViewId(null);
      setEditingName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingViewId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-6">
      {/* Modal de creación de vista */}
      <ViewCreationModal
        isOpen={viewCreationModal.isOpen}
        isLoading={viewCreationModal.isLoading}
        error={viewCreationModal.error}
        success={viewCreationModal.success}
        onClose={onCloseViewCreationModal}
      />

      {/* Modal de eliminación de vista */}
      <ViewDeletionModal
        isOpen={viewDeletionModal.isOpen}
        isLoading={viewDeletionModal.isLoading}
        error={viewDeletionModal.error}
        success={viewDeletionModal.success}
        viewName={viewDeletionModal.viewName}
        onConfirm={onConfirmDeleteView}
        onCancel={onCancelDeleteView}
        onClose={onCloseViewDeletionModal}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Configurar Vistas
          </h2>
          <p className="text-gray-600 text-sm">
            Define qué productos se mostrarán en cada vista
          </p>
        </div>
        <Button type="button" variant="primary" onClick={onAddView}>
          + Agregar Vista
        </Button>
      </div>

      {views.length > 0 ? (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[150px]">
                  Vista
                </th>
                {sortedProducts.map((product, i) => (
                  <th
                    key={product.product_id}
                    className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[100px]"
                  >
                    {product.name || `Producto ${i + 1}`}
                  </th>
                ))}
                <th className="p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {views.map((view) => (
                <tr
                  key={view.view_id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3 border-r border-gray-300">
                    {editingViewId === view.view_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2 py-1 text-black border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(view.view_id!);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(view.view_id!)}
                          className="text-green-600 hover:text-green-800 transition-colors p-1"
                          title="Guardar"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                          title="Cancelar"
                        >
                          <svg
                            className="w-5 h-5"
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
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800 font-medium flex-1">
                          {view.name || "Nueva vista"}
                        </span>
                        <button
                          onClick={() => handleStartEdit(view)}
                          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                          title="Editar nombre"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  {sortedProducts.map((product) => (
                    <td
                      key={product.product_id}
                      className="p-3 text-center border-r border-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={(viewProducts[view.view_id!] || []).includes(
                          product.product_id!
                        )}
                        onChange={() =>
                          onToggleProduct(view.view_id!, product.product_id!)
                        }
                        className="w-5 h-5 text-gray-800 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeleteView(view.view_id!)}
                      className="text-gray-600 hover:text-red-600 transition-colors p-2 rounded hover:bg-red-50"
                      title="Eliminar vista"
                    >
                      <svg
                        className="w-5 h-5"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600">No hay vistas configuradas</p>
          <p className="text-gray-500 text-sm mt-1">
            Haz clic en &quot;Agregar Vista&quot; para comenzar
          </p>
        </div>
      )}

      <div className="flex justify-start pt-4">
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
