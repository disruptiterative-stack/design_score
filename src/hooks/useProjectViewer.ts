import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/src/domain/entities/Project";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { getProjectByIdAction } from "@/src/app/actions/projectActions";
import {
  getViewsByProjectIdAction,
  getProductsByViewIdAction,
} from "@/src/app/actions/viewActions";
import {
  getPublicProjectAction,
  getPublicViewsAction,
  getPublicProductsByViewAction,
} from "@/src/app/actions/publicActions";

/**
 * Hook para manejar la visualización de un proyecto con navegación por vistas
 * Soporta tanto proyectos autenticados como proyectos públicos
 */
export function useProjectViewer(projectIdOrKey: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[][]>([]); // Todos los productos de todas las vistas
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);

  /**
   * Detecta si el identificador es un UUID (project_id) o un public_key
   */
  const isUUID = (str: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  /**
   * Carga los datos del proyecto, vistas y TODOS los productos
   */
  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let projectData: Project | null = null;
      let actualProjectId: string;
      let _isPublicView = false;

      /*  console.log("🔍 Cargando proyecto con identificador:", projectIdOrKey); */

      // Determinar si es un UUID o un public_key

      if (isUUID(projectIdOrKey)) {
        // Es un project_id - usar acciones autenticadas
        /*        console.log("📋 Detectado como UUID - modo autenticado"); */
        setIsPublicView(false);
        _isPublicView = false;
        projectData = await getProjectByIdAction(projectIdOrKey);

        actualProjectId = projectIdOrKey;
      } else {
        // Es un public_key - usar acciones públicas
        /*   console.log("🔑 Detectado como public_key - modo público"); */
        setIsPublicView(true);
        _isPublicView = true;
        projectData = await getPublicProjectAction(projectIdOrKey);

        /*         console.log("📦 Proyecto obtenido:", projectData); */

        if (!projectData) {
          console.error("❌ Proyecto no encontrado");
          setError("Proyecto no encontrado o no es público");
          return;
        }

        // Verificar que el proyecto sea público
        if (!projectData.is_public) {
          console.error("❌ Proyecto no es público");
          setError("Este proyecto no está disponible públicamente");
          return;
        }

        // ⚠️ IMPORTANTE: Usar el project_id del proyecto, NO el public_key
        actualProjectId = projectData.project_id!;
      }

      if (!projectData) {
        console.error("❌ Proyecto no encontrado (autenticado)");
        setError("Proyecto no encontrado");
        return;
      }

      setProject(projectData);

      // Cargar vistas según el modo (público o autenticado)
      const viewsData = _isPublicView
        ? await getPublicViewsAction(actualProjectId)
        : await getViewsByProjectIdAction(actualProjectId);

      /*      console.log("📋 Vistas obtenidas:", viewsData.length); */

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

      // Cargar TODOS los productos de TODAS las vistas según el modo
      const productsPromises = sortedViews.map((view) => {
        if (!view.view_id) return Promise.resolve([]);

        return _isPublicView
          ? getPublicProductsByViewAction(view.view_id)
          : getProductsByViewIdAction(view.view_id);
      });

      const productsArray = await Promise.all(productsPromises);
      /*      console.log(
        "📦 Productos cargados:",
        productsArray.map((p) => p.length)
      ); */
      setAllProducts(productsArray);
    } catch (err: any) {
      console.error("Error cargando proyecto:", err);
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
   * Vuelve al dashboard o reinicia el recorrido público
   */
  const handleBackToDashboard = () => {
    if (isPublicView) {
      // Para vistas públicas, reiniciar el recorrido
      setCurrentViewIndex(0);
      setShowFinalMessage(false);
    } else {
      // Para vistas autenticadas, volver al dashboard
      router.push("/dashboard");
    }
  };

  // Cargar proyecto y vistas al montar
  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdOrKey]);

  // Obtener productos de la vista actual
  const currentProducts = allProducts[currentViewIndex] || [];

  return {
    // Estado
    isLoading,
    error,
    project,
    views,
    allProducts, // Todos los productos cargados
    currentViewIndex,
    currentView: views[currentViewIndex] || null,
    currentProducts, // Productos de la vista actual
    totalViews: views.length,
    showFinalMessage,
    isPublicView, // Indica si es una vista pública

    // Navegación
    hasNextView: currentViewIndex < views.length - 1,
    hasPreviousView: currentViewIndex > 0,
    handleNextView,
    handlePreviousView,
    handleBackToDashboard,
  };
}
