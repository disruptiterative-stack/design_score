import { Project } from "@/src/domain/entities/Project";
import { useState } from "react";

interface ProjectCardProps {
  project: Project;
  onPlay: (projectId: string) => void;
  onInfo: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onTogglePublic?: (projectId: string, isPublic: boolean) => void;
}

export default function ProjectCard({
  project,
  onPlay,
  onInfo,
  onDelete,
  onTogglePublic,
}: ProjectCardProps) {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  // Usar los valores calculados en el servidor o calcular como fallback
  const numProducts = project.num_products ?? project.products?.length ?? 0;
  const totalWeight =
    project.size ??
    (project.products?.reduce((sum, p) => sum + (p.weight || 0), 0) || 0);

  const handleCopyPublicLink = async () => {
    if (!project.public_key) return;

    const publicUrl = `${window.location.origin}/project/${project.public_key}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error("Error al copiar el enlace:", err);
      alert("No se pudo copiar el enlace");
    }
  };

  const handleTogglePublic = async () => {
    if (onTogglePublic && project.project_id) {
      setIsTogglingPublic(true);
      try {
        await onTogglePublic(project.project_id, !project.is_public);
      } finally {
        setIsTogglingPublic(false);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-[20em] w-[15em] flex flex-col relative">
      {/* Overlay de carga */}
      {isTogglingPublic && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-700 font-medium">
              {project.is_public
                ? "Generando nuevo enlace..."
                : "Haciendo público..."}
            </p>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xl font-medium text-gray-800 mt-3 mb-3 truncate w-full text-center">
            {project.name}
          </h3>

          {/* Información adicional */}
          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-4 text-center">
            <span>📦 Productos: {numProducts}</span>
            <span className="text-neutral-600 font-medium">
              💾 Tamaño: {totalWeight.toFixed(2)} MB
            </span>
          </div>

          {/* Mensaje de copiado */}
          {showCopiedMessage && (
            <div className="mb-2">
              <span className="text-xs text-green-600 font-medium">
                ✓ Enlace copiado
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción principales */}
        <div className="flex gap-2 justify-center flex-wrap mb-3">
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

      {/* Sección de compartir público - en la base */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Switch de público/privado */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePublic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                project.is_public
                  ? "bg-green-600 focus:ring-green-500"
                  : "bg-gray-300 focus:ring-gray-400"
              }`}
              title={project.is_public ? "Hacer privado" : "Hacer público"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  project.is_public ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-xs font-medium text-gray-700">
              {project.is_public ? (
                <span className="text-green-700">Público</span>
              ) : (
                "Privado"
              )}
            </span>
          </div>

          {/* Botón de copiar enlace (solo si es público) */}
          {project.is_public && project.public_key && (
            <button
              onClick={handleCopyPublicLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-600 text-white rounded text-xs font-medium transition-colors"
              title="Copiar enlace público"
            >
              <LinkIcon />
              <span>Copiar</span>
            </button>
          )}
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

function ShareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
