import { useState } from "react";

export interface ViewConfig {
  name: string;
  products: boolean[];
}

/**
 * Hook para manejar la configuración de vistas de productos
 */
export function useProjectViews() {
  const [views, setViews] = useState<ViewConfig[]>([]);

  /**
   * Inicializa las vistas según el número de productos
   */
  const initializeViews = (numProducts: number) => {
    if (views.length === 0) {
      const initialViews: ViewConfig[] = [
        {
          name: "Nueva vista",
          products: Array(numProducts).fill(false),
        },
      ];
      setViews(initialViews);
    }
  };

  /**
   * Actualiza las vistas cuando cambia el número de productos
   */
  const updateViewsForNewProducts = (numProducts: number) => {
    if (views.length === 0) {
      initializeViews(numProducts);
      return;
    }

    // Ajustar vistas existentes al nuevo número de productos
    const updatedViews = views.map((view) => {
      const currentProducts = view.products;
      const newProducts = Array(numProducts).fill(false);

      // Mantener los valores existentes hasta el nuevo límite
      for (let i = 0; i < Math.min(currentProducts.length, numProducts); i++) {
        newProducts[i] = currentProducts[i];
      }

      return { ...view, products: newProducts };
    });

    setViews(updatedViews);
  };

  /**
   * Obtiene los IDs de productos seleccionados para una vista específica
   */
  const getSelectedProductIds = (
    viewIndex: number,
    productIds: string[]
  ): string[] => {
    if (viewIndex >= views.length) return [];

    const viewConfig = views[viewIndex];
    return viewConfig.products
      .map((isSelected, productIdx) =>
        isSelected ? productIds[productIdx] : null
      )
      .filter((id): id is string => id !== null);
  };

  const resetViews = () => {
    setViews([]);
  };

  return {
    views,
    setViews,
    initializeViews,
    updateViewsForNewProducts,
    getSelectedProductIds,
    resetViews,
  };
}
