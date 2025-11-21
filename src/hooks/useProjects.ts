import { useState, useEffect } from "react";
import { getAllProjectsAction } from "@/src/app/actions/projectActions";
import { Project } from "@/src/domain/entities/Project";

/**
 * Hook para manejar la carga y gestión de proyectos
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga todos los proyectos
   */
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectsList = await getAllProjectsAction();
      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      console.error("Error cargando proyectos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Encuentra un proyecto por ID
   */
  const findProject = (projectId: string): Project | undefined => {
    return projects.find((p) => p.project_id === projectId);
  };

  /**
   * Remueve un proyecto de la lista (después de eliminar)
   */
  const removeProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
  };

  /**
   * Carga inicial
   */
  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    findProject,
    removeProject,
  };
}
