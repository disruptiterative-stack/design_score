import Button from "@/src/components/ui/Button";

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  numProducts: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteProjectModal({
  isOpen,
  projectName,
  numProducts,
  onConfirm,
  onCancel,
}: DeleteProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Eliminar Proyecto
        </h2>
        <p className="mb-4 text-gray-700 whitespace-pre-line">
          ⚠️ ¿Estás seguro de que deseas eliminar &quot;{projectName}&quot;?
          {"\n\n"}
          Solo se eliminará este proyecto. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
