import { useState } from "react";
import { updateProjectAction } from "@/src/app/actions/projectActions";

/**
 * Hook para manejar la edición de información del proyecto
 */
export function useProjectInfoEditor(
  projectId: string,
  initialName: string,
  initialMessage: string
) {
  const [name, setName] = useState(initialName);
  const [finalMessage, setFinalMessage] = useState(initialMessage);
  const [isSaving, setIsSaving] = useState(false);

  const updateInfo = async () => {
    if (!name.trim()) {
      throw new Error("El nombre del proyecto es obligatorio");
    }

    try {
      setIsSaving(true);

      const result = await updateProjectAction(projectId, {
        name: name.trim(),
        final_message: finalMessage.trim() || undefined,
      });

      if (!result.ok) {
        throw new Error(result.error || "Error al actualizar proyecto");
      }

      return result.project;
    } catch (err: any) {
      console.error("Error actualizando proyecto:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    name,
    setName,
    finalMessage,
    setFinalMessage,
    isSaving,
    updateInfo,
  };
}
