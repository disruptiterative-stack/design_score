import { createProjectAction } from "@/src/app/actions/projectActions";
import {
  createViewAction,
  assignProductsToViewAction,
} from "@/src/app/actions/viewActions";
import { ViewConfig } from "@/src/hooks/useProjectViews";

/**
 * Datos del proyecto a crear
 */
export interface ProjectCreationData {
  name: string;
  finalMessage?: string;
  numProducts: number;
}

/**
 * Resultado de la creación del proyecto
 */
export interface ProjectCreationResult {
  success: boolean;
  project?: any;
  products?: any[];
  error?: string;
}

/**
 * Servicio para manejar la creación de proyectos
 */
export class ProjectCreationService {
  /**
   * Crea un proyecto (sin crear productos, solo el proyecto)
   */
  static async createProject(
    data: ProjectCreationData
  ): Promise<ProjectCreationResult> {
    try {
      // Crear el proyecto
      const projectResult = await createProjectAction({
        name: data.name,
        num_products: data.numProducts,
        final_message: data.finalMessage || undefined,
      });

      if (!projectResult.ok || !projectResult.project) {
        throw new Error(projectResult.error || "Error al crear proyecto");
      }

      return {
        success: true,
        project: projectResult.project,
        products: [],
      };
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Crea las vistas y asigna productos
   */
  static async createViews(
    projectId: string,
    views: ViewConfig[],
    productIds: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Crear todas las vistas con timestamp único para evitar conflictos de idx
      const viewCreationResults = await Promise.all(
        views.map((view, idx) => {
          // Generar idx único basado en timestamp + índice para garantizar unicidad
          const uniqueIdx = `${Date.now()}_${idx}`;
          return createViewAction(projectId, uniqueIdx, view.name);
        })
      );

      // Log de resultados
      viewCreationResults.forEach((result, idx) => {
        if (!result.ok) {
          console.error(`❌ Error creando vista ${idx + 1}:`, result.error);
          errors.push(`Vista ${idx + 1}: ${result.error}`);
        } else {
          console.log(`✅ Vista ${idx + 1} creada: ${result.view?.view_id}`);
        }
      });

      // Asignar productos a cada vista
      for (let viewIdx = 0; viewIdx < views.length; viewIdx++) {
        const viewConfig = views[viewIdx];
        const viewResult = viewCreationResults[viewIdx];

        if (viewResult.ok && viewResult.view) {
          // Obtener los IDs de productos seleccionados
          const selectedProductIds = viewConfig.products
            .map((isSelected, productIdx) =>
              isSelected ? productIds[productIdx] : null
            )
            .filter((id): id is string => id !== null);

          if (selectedProductIds.length > 0) {
            console.log(
              `Asignando ${selectedProductIds.length} productos a vista ${
                viewIdx + 1
              }`
            );

            const assignResult = await assignProductsToViewAction(
              viewResult.view.view_id!,
              selectedProductIds
            );

            if (!assignResult.ok) {
              console.error(
                `❌ Error asignando productos a vista ${viewIdx + 1}:`,
                assignResult.error
              );
              errors.push(
                `Asignación vista ${viewIdx + 1}: ${assignResult.error}`
              );
            } else {
              console.log(`✅ Productos asignados a vista ${viewIdx + 1}`);
            }
          } else {
            console.log(
              `ℹ️ Vista ${viewIdx + 1} no tiene productos seleccionados`
            );
          }
        } else {
          console.warn(
            `⚠️ Saltando asignación de productos para vista ${
              viewIdx + 1
            } (no se creó correctamente)`
          );
        }
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Realiza rollback eliminando el proyecto creado
   */
  static async rollback(projectId: string): Promise<void> {
    try {
      const { deleteProjectAction } = await import(
        "@/src/app/actions/projectActions"
      );

      console.log("🗑️ Eliminando proyecto y recursos asociados...");
      const deleteResult = await deleteProjectAction(projectId);

      if (deleteResult.ok) {
        console.log("✅ Rollback completado: Proyecto y recursos eliminados");
      } else {
        console.error("⚠️ Error en rollback:", deleteResult.error);
      }
    } catch (error: any) {
      console.error("❌ Error durante rollback:", error.message);
      throw error;
    }
  }
}
