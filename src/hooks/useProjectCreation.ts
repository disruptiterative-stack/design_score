import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "./useLoadingState";
import { useProjectViews } from "./useProjectViews";
import { ProjectCreationService } from "@/src/lib/projectCreationService";
import { addProductToProjectAction } from "@/src/app/actions/productActions";

/**
 * Datos del proyecto
 */
export interface ProjectData {
  name: string;
  finalMessage: string;
}

/**
 * Hook principal para manejar el proceso completo de creación de proyecto
 */
export function useProjectCreation() {
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    finalMessage: "",
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const loadingState = useLoadingState();
  const viewsState = useProjectViews();

  /**
   * Maneja la selección de productos y actualiza las vistas
   */
  const handleProductsSelected = (productIds: string[]) => {
    setSelectedProductIds(productIds);
    viewsState.updateViewsForNewProducts(productIds.length);
  };

  /**
   * Procesa la creación completa del proyecto
   */
  const createProject = async () => {
    let createdProject: any = null;

    try {
      loadingState.startLoading("Preparando proyecto...");

      // 1. Crear proyecto
      const projectResult = await ProjectCreationService.createProject({
        name: projectData.name,
        finalMessage: projectData.finalMessage,
        numProducts: selectedProductIds.length,
      });

      if (!projectResult.success || !projectResult.project) {
        throw new Error(projectResult.error || "Error al crear proyecto");
      }

      createdProject = projectResult.project;

      // 2. Asociar productos seleccionados al proyecto
      if (selectedProductIds.length > 0) {
        loadingState.updateProgress(30, "Asociando productos al proyecto...");

        const associationPromises = selectedProductIds.map((productId) =>
          addProductToProjectAction(productId, createdProject.project_id!)
        );

        const results = await Promise.all(associationPromises);
        const hasErrors = results.some((r) => !r.ok);

        if (hasErrors) {
          throw new Error("Error al asociar algunos productos al proyecto");
        }

        loadingState.updateProgress(60, "Productos asociados correctamente");
      }

      // 3. Crear vistas y asignar productos
      loadingState.updateProgress(70, "Creando vistas...");

      const viewsResult = await ProjectCreationService.createViews(
        createdProject.project_id!,
        viewsState.views,
        selectedProductIds
      );

      if (!viewsResult.success && viewsResult.errors.length > 0) {
        console.warn("⚠️ Algunas vistas tuvieron errores:", viewsResult.errors);
      }

      // 4. Éxito - Redireccionar
      loadingState.updateProgress(100, "¡Proyecto creado exitosamente!");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("✅ Proyecto creado completamente");
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("❌ Error creando proyecto:", error);

      // Rollback
      loadingState.updateProgress(0, "Error detectado. Realizando limpieza...");

      if (createdProject?.project_id) {
        try {
          await ProjectCreationService.rollback(createdProject.project_id);
        } catch (rollbackError: unknown) {
          const rollbackMsg =
            rollbackError instanceof Error
              ? rollbackError.message
              : String(rollbackError);
          console.error("❌ Error durante rollback:", rollbackMsg);
        }
      }

      // Mostrar error
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      alert(
        `❌ Error al crear el proyecto: ${errorMsg}\n\n` +
          `Los cambios han sido revertidos automáticamente.`
      );

      loadingState.resetLoading();
    }
  };

  return {
    // Estado del proyecto
    projectData,
    setProjectData,

    // Productos seleccionados
    selectedProductIds,
    setSelectedProductIds,
    handleProductsSelected,

    // Vistas
    views: viewsState.views,
    setViews: viewsState.setViews,

    // Carga
    isSubmitting: loadingState.isLoading,
    loadingProgress: loadingState.progress,
    loadingMessage: loadingState.message,

    // Acciones
    createProject,
  };
}
