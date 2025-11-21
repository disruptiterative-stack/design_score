import { Project } from "@/src/domain/entities/Project";

interface ProjectCardProps {
  project: Project;
  onPlay: (projectId: string) => void;
  onInfo: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onPlay,
  onInfo,
  onDelete,
}: ProjectCardProps) {
  // Usar los valores calculados en el servidor o calcular como fallback
  const numProducts = project.num_products ?? project.products?.length ?? 0;
  const totalWeight =
    project.size ??
    (project.products?.reduce((sum, p) => sum + (p.weight || 0), 0) || 0);

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-[16em] w-[15em]">
      {/* Contenido */}
      <div className="p-6 h-full flex flex-col justify-between">
        <div className="w-full h-full flex flex-col items-center">
          <h3 className="text-xl font-medium text-gray-800 mt-5 mb-3 truncate w-full text-center">
            {project.name}
          </h3>

          {/* Información adicional */}
          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-4 text-center">
            <span>📦 Productos: {numProducts}</span>
            <span className="text-neutral-600 font-medium">
              💾 Tamaño: {totalWeight.toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => onPlay(project.project_id!)}
            className="flex items-center justify-center w-10 h-10 bg-gray-800 hover:bg-black text-white rounded transition-colors"
            title="Reproducir"
          >
            <PlayIcon />
          </button>
          <button
            onClick={() => onInfo(project.project_id!)}
            className="flex items-center justify-center w-10 h-10 bg-neutral-600 hover:bg-neutral-800 text-white rounded transition-colors"
            title="Información"
          >
            <InfoIcon />
          </button>
          <button
            onClick={() => onDelete(project.project_id!)}
            className="flex items-center justify-center w-10 h-10 bg-gray-400 hover:bg-gray-600 text-white rounded transition-colors"
            title="Eliminar"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// Iconos SVG simples
function PlayIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
