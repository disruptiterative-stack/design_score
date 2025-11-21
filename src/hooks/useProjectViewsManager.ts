import { useState, useEffect, useCallback } from "react";
import {
  getViewsByProjectIdAction,
  getProductsByViewIdAction,
  assignProductsToViewAction,
  deleteViewAction,
  createViewAction,
  updateViewAction,
} from "@/src/app/actions/viewActions";
import { View } from "@/src/domain/entities/View";

/**
 * Hook para manejar las vistas de un proyecto
 */
export function useProjectViewsManager(projectId: string) {
  const [views, setViews] = useState<View[]>([]);
  const [viewProducts, setViewProducts] = useState<Record<string, string[]>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadViews = useCallback(async () => {
    try {
      setIsLoading(true);

      // Cargar vistas
      const viewsData = await getViewsByProjectIdAction(projectId);
      setViews(viewsData);

      // Cargar productos de todas las vistas en paralelo (optimización)
      const productsMap: Record<string, string[]> = {};
      const productsPromises = viewsData.map(async (view) => {
        if (view.view_id) {
          const products = await getProductsByViewIdAction(view.view_id);
          return {
            viewId: view.view_id,
            productIds: products.map((p) => p.product_id!),
          };
        }
        return null;
      });

      const results = await Promise.all(productsPromises);
      results.forEach((result) => {
        if (result) {
          productsMap[result.viewId] = result.productIds;
        }
      });

      setViewProducts(productsMap);
    } catch (err: any) {
      console.error("Error cargando vistas:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadViews();
    }
  }, [projectId, loadViews]);

  const toggleProductInView = async (viewId: string, productId: string) => {
    const currentProducts = viewProducts[viewId] || [];
    const isSelected = currentProducts.includes(productId);

    const newProducts = isSelected
      ? currentProducts.filter((id) => id !== productId)
      : [...currentProducts, productId];

    // Actualización optimista - actualizar UI inmediatamente
    setViewProducts({
      ...viewProducts,
      [viewId]: newProducts,
    });

    try {
      const result = await assignProductsToViewAction(viewId, newProducts);

      if (!result.ok) {
        // Revertir cambio optimista si falla
        setViewProducts({
          ...viewProducts,
          [viewId]: currentProducts,
        });
        throw new Error(result.error || "Error al actualizar vista");
      }
    } catch (err: any) {
      console.error("Error actualizando vista:", err);
      throw err;
    }
  };

  const addView = async () => {
    try {
      // Generar idx único basado en timestamp para evitar conflictos
      const newIdx = Date.now().toString();
      const defaultName = "Nueva vista";
      const result = await createViewAction(projectId, newIdx, defaultName);

      if (result.ok && result.view) {
        // Actualización directa después de creación exitosa
        setViews([...views, result.view]);
        setViewProducts({
          ...viewProducts,
          [result.view.view_id!]: [],
        });
        return result.view;
      } else {
        throw new Error(result.error || "Error al crear vista");
      }
    } catch (err: any) {
      console.error("Error creando vista:", err);
      throw err;
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      const result = await deleteViewAction(viewId);

      if (result.ok) {
        setViews(views.filter((v) => v.view_id !== viewId));
        const newViewProducts = { ...viewProducts };
        delete newViewProducts[viewId];
        setViewProducts(newViewProducts);
      } else {
        throw new Error(result.error || "Error al eliminar vista");
      }
    } catch (err: any) {
      console.error("Error eliminando vista:", err);
      throw err;
    }
  };

  const updateViewName = async (viewId: string, newName: string) => {
    // Actualización optimista - actualizar UI inmediatamente
    const previousViews = [...views];
    setViews(
      views.map((v) => (v.view_id === viewId ? { ...v, name: newName } : v))
    );

    try {
      const result = await updateViewAction(viewId, { name: newName });

      if (result.ok && result.view) {
        // Actualizar con los datos del servidor
        setViews(views.map((v) => (v.view_id === viewId ? result.view! : v)));
      } else {
        // Revertir cambio optimista si falla
        setViews(previousViews);
        throw new Error(result.error || "Error al actualizar nombre de vista");
      }
    } catch (err: any) {
      // Revertir cambio optimista si hay error
      setViews(previousViews);
      console.error("Error actualizando nombre de vista:", err);
      throw err;
    }
  };

  const reloadViewProducts = async () => {
    try {
      // Recargar vistas primero para obtener la lista actualizada
      const viewsData = await getViewsByProjectIdAction(projectId);
      setViews(viewsData);

      // Cargar productos de todas las vistas en paralelo (sin cambiar isLoading)
      const productsPromises = viewsData.map(async (view) => {
        if (view.view_id) {
          const products = await getProductsByViewIdAction(view.view_id);
          return {
            viewId: view.view_id,
            productIds: products.map((p) => p.product_id!),
          };
        }
        return null;
      });

      const results = await Promise.all(productsPromises);
      const productsMap: Record<string, string[]> = {};
      results.forEach((result) => {
        if (result) {
          productsMap[result.viewId] = result.productIds;
        }
      });

      setViewProducts(productsMap);
    } catch (err: any) {
      console.error("Error recargando productos de vistas:", err);
      throw err;
    }
  };

  return {
    views,
    viewProducts,
    isLoading,
    loadViews,
    toggleProductInView,
    addView,
    deleteView,
    updateViewName,
    reloadViewProducts,
  };
}
