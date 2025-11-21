import { useState, useEffect } from "react";
import { getProjectByIdWithProductsAction } from "@/src/app/actions/projectActions";
import { Project } from "@/src/domain/entities/Project";

/**
 * Hook para cargar y manejar el estado de un proyecto
 */
export function useProjectData(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProject = async () => {
    try {
      setIsLoading(true);
      setError("");

      const projectData = await getProjectByIdWithProductsAction(projectId);

      if (!projectData) {
        setError("Proyecto no encontrado");
        return;
      }

      setProject(projectData);
    } catch (err: any) {
      console.error("Error cargando proyecto:", err);
      setError(err.message || "Error al cargar el proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const getTotalWeight = () => {
    return (project?.products || []).reduce(
      (sum, p) => sum + (p.weight || 0),
      0
    );
  };

  return {
    project,
    setProject,
    isLoading,
    error,
    loadProject,
    products: project?.products || [],
    getTotalWeight,
  };
}
