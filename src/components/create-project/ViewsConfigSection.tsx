"use client";

import { useState } from "react";
import Button from "@/src/components/ui/Button";

interface View {
  name: string;
  products: boolean[];
}

interface ViewsConfigSectionProps {
  numProducts: number;
  views: View[];
  onViewsChange: (views: View[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ViewsConfigSection({
  numProducts,
  views,
  onViewsChange,
  onBack,
  onSubmit,
  isSubmitting,
}: ViewsConfigSectionProps) {
  const [editingViewIndex, setEditingViewIndex] = useState<number | null>(null);
  const [editingViewName, setEditingViewName] = useState("");

  const addView = () => {
    const newView: View = {
      name: "Nueva vista",
      products: Array(numProducts).fill(false),
    };
    onViewsChange([...views, newView]);
  };

  const removeView = (index: number) => {
    onViewsChange(views.filter((_, i) => i !== index));
  };

  const toggleProduct = (viewIndex: number, productIndex: number) => {
    const updatedViews = views.map((view, vIdx) => {
      if (vIdx === viewIndex) {
        const newProducts = [...view.products];
        newProducts[productIndex] = !newProducts[productIndex];
        return { ...view, products: newProducts };
      }
      return view;
    });
    onViewsChange(updatedViews);
  };

  const startEditingView = (index: number) => {
    setEditingViewIndex(index);
    setEditingViewName(views[index].name);
  };

  const saveViewName = (index: number) => {
    if (editingViewName.trim()) {
      const updatedViews = views.map((view, i) =>
        i === index ? { ...view, name: editingViewName.trim() } : view
      );
      onViewsChange(updatedViews);
    }
    setEditingViewIndex(null);
    setEditingViewName("");
  };

  const selectAllProducts = (viewIndex: number) => {
    const updatedViews = views.map((view, vIdx) => {
      if (vIdx === viewIndex) {
        return { ...view, products: Array(numProducts).fill(true) };
      }
      return view;
    });
    onViewsChange(updatedViews);
  };

  const deselectAllProducts = (viewIndex: number) => {
    const updatedViews = views.map((view, vIdx) => {
      if (vIdx === viewIndex) {
        return { ...view, products: Array(numProducts).fill(false) };
      }
      return view;
    });
    onViewsChange(updatedViews);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Configurar Vistas
          </h2>
          <p className="text-gray-600 text-sm">
            Define qué productos se mostrarán en cada vista
          </p>
        </div>
        <Button type="button" variant="primary" onClick={addView}>
          + Agregar Vista
        </Button>
      </div>

      {/* Views Table */}
      {views.length > 0 ? (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[200px]">
                  Vista
                </th>
                {Array.from({ length: numProducts }, (_, i) => (
                  <th
                    key={i}
                    className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[80px]"
                  >
                    Producto {i + 1}
                  </th>
                ))}
                <th className="p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {views.map((view, viewIndex) => (
                <tr
                  key={viewIndex}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3 border-r border-gray-300">
                    {editingViewIndex === viewIndex ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingViewName}
                          onChange={(e) => setEditingViewName(e.target.value)}
                          className="flex-1 p-1 text-black border border-gray-300 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              saveViewName(viewIndex);
                            }
                          }}
                          onBlur={() => saveViewName(viewIndex)}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => startEditingView(viewIndex)}
                      >
                        <span className="text-gray-800 font-medium">
                          {view.name}
                        </span>
                        <span className="text-gray-400 hover:text-gray-600 text-xs">
                          ✎
                        </span>
                      </div>
                    )}
                  </td>
                  {view.products.map((isSelected, productIndex) => (
                    <td
                      key={productIndex}
                      className="p-3 text-center border-r border-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(viewIndex, productIndex)}
                        className="w-5 h-5 text-gray-800 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => removeView(viewIndex)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title="Eliminar vista"
                    >
                      <TrashIcon />
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
            Haz clic en "Agregar Vista" para comenzar
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          ← Anterior
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          disabled={views.length === 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          Crear Proyecto
        </Button>
      </div>
    </div>
  );
}

// Icono de basura
function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
