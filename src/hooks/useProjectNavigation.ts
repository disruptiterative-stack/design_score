import { useRouter } from "next/navigation";

/**
 * Hook para manejar la navegación entre páginas del proyecto
 */
export function useProjectNavigation() {
  const router = useRouter();

  /**
   * Navega a la página de visualización del proyecto en una nueva pestaña
   */
  const navigateToPlay = (projectId: string) => {
    window.open(`/project/${projectId}`, "_blank");
  };

  /**
   * Navega a la página de edición del proyecto
   */
  const navigateToEdit = (projectId: string) => {
    router.push(`/edit-project/${projectId}`);
  };

  /**
   * Navega a la página de creación de proyecto
   */
  const navigateToCreate = () => {
    router.push("/create-project");
  };

  /**
   * Navega al dashboard
   */
  const navigateToDashboard = () => {
    router.push("/dashboard");
  };

  return {
    navigateToPlay,
    navigateToEdit,
    navigateToCreate,
    navigateToDashboard,
  };
}
