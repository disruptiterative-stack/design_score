import { useRouter } from "next/navigation";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import { useEffect, useState } from "react";

interface ProjectInfoTabProps {
  name: string;
  setName: (name: string) => void;
  finalMessage: string;
  setFinalMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSaving: boolean;
}

export function ProjectInfoTab({
  name,
  setName,
  finalMessage,
  setFinalMessage,
  onSubmit,
  isSaving,
}: ProjectInfoTabProps) {
  const router = useRouter();
  const [initialName, setInitialName] = useState(name);
  const [initialMessage, setInitialMessage] = useState(finalMessage);
  const [hasChanges, setHasChanges] = useState(false);

  // Guardar valores iniciales cuando el componente se monta o cuando se guarda
  useEffect(() => {
    setInitialName(name);
    setInitialMessage(finalMessage);
  }, []);

  // Detectar cambios
  useEffect(() => {
    const nameChanged = name !== initialName;
    const messageChanged = finalMessage !== initialMessage;
    setHasChanges(nameChanged || messageChanged);
  }, [name, finalMessage, initialName, initialMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    await onSubmit(e);
    // Actualizar valores iniciales después de guardar exitosamente
    setInitialName(name);
    setInitialMessage(finalMessage);
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        type="text"
        label="Nombre del Proyecto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Mi Proyecto 3D"
        required
        containerClassName="mb-4"
      />

      <div className="flex flex-col">
        <label className="text-gray-700 text-sm mb-2">
          Mensaje Final (Opcional)
        </label>
        <textarea
          value={finalMessage}
          onChange={(e) => setFinalMessage(e.target.value)}
          placeholder="Mensaje que se mostrará al finalizar la presentación..."
          rows={4}
          className="w-full p-3 bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors resize-none rounded"
        />
        <p className="text-gray-500 text-xs mt-1">
          Este mensaje se mostrará después de que el usuario complete todas las
          vistas
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          disabled={isSaving}
        >
          ← Volver al Dashboard
        </Button>
        {hasChanges && (
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        )}
      </div>
    </form>
  );
}
