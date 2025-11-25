import { useState, useEffect } from "react";
import { Project } from "@/src/domain/entities/Project";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import {
  getPublicProjectAction,
  getPublicViewsAction,
  getPublicProductsByViewAction,
} from "@/src/app/actions/publicActions";

/**
 * Hook para manejar la visualización de un proyecto público
 * usando su public_key en lugar del project_id
 */
export function usePublicProjectViewer(publicKey: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[][]>([]);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  /**
   * Carga los datos del proyecto público, vistas y TODOS los productos
   */
  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar proyecto usando public_key
      const projectData = await getPublicProjectAction(publicKey);
      if (!projectData) {
        setError("Proyecto no encontrado o no es público");
        return;
      }

      // Verificar que el proyecto sea público
      if (!projectData.is_public) {
        setError("Este proyecto no está disponible públicamente");
        return;
      }

      setProject(projectData);

      // Cargar vistas ordenadas por idx
      const viewsData = await getPublicViewsAction(projectData.project_id!);
      if (viewsData.length === 0) {
        setError("No hay vistas configuradas para este proyecto");
        return;
      }

      // Ordenar vistas por idx
      const sortedViews = [...viewsData].sort((a, b) => {
        const idxA = parseInt(a.idx);
        const idxB = parseInt(b.idx);
        return idxA - idxB;
      });

      setViews(sortedViews);

      // Cargar TODOS los productos de TODAS las vistas
      const productsPromises = sortedViews.map((view) =>
        view.view_id
          ? getPublicProductsByViewAction(view.view_id)
          : Promise.resolve([])
      );

      const productsArray = await Promise.all(productsPromises);
      setAllProducts(productsArray);
    } catch (err: any) {
      console.error("Error cargando proyecto público:", err);
      setError(err.message || "Error al cargar el proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navega a la siguiente vista
   */
  const handleNextView = () => {
    if (currentViewIndex < views.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
    } else {
      // Última vista, mostrar mensaje final
      setShowFinalMessage(true);
    }
  };

  /**
   * Navega a la vista anterior
   */
  const handlePreviousView = () => {
    if (currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
    }
  };

  /**
   * Reinicia el recorrido
   */
  const handleRestart = () => {
    setCurrentViewIndex(0);
    setShowFinalMessage(false);
  };

  // Cargar proyecto y vistas al montar
  useEffect(() => {
    if (publicKey) {
      loadProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  // Obtener productos de la vista actual
  const currentProducts = allProducts[currentViewIndex] || [];

  return {
    // Estado
    isLoading,
    error,
    project,
    views,
    allProducts,
    currentViewIndex,
    currentView: views[currentViewIndex] || null,
    currentProducts,
    totalViews: views.length,
    showFinalMessage,

    // Navegación
    hasNextView: currentViewIndex < views.length - 1,
    hasPreviousView: currentViewIndex > 0,
    handleNextView,
    handlePreviousView,
    handleRestart,
  };
}
