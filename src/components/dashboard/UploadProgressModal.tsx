"use client";

// Icons
function InfoIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExtractIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function UpdateIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

interface UploadProgressModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  filesUploaded: number;
  totalFiles: number;
  currentFileName?: string;
  phase?: "extracting" | "uploading-images" | "updating-product" | "complete";
}

export default function UploadProgressModal({
  isOpen,
  progress,
  message,
  phase = "extracting",
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  /*   console.log(
    "🎨 [Modal] Renderizando modal - Progreso:",
    progress,
    "Fase:",
    phase,
    "Mensaje:",
    message
  ); */

  // Determinar el ícono y color según la fase
  const getPhaseInfo = () => {
    switch (phase) {
      case "extracting":
        return {
          icon: <ExtractIcon />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          label: "Extrayendo archivos ZIP",
        };
      case "uploading-images":
        return {
          icon: <UploadIcon />,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          label: "Subiendo imágenes",
        };
      case "updating-product":
        return {
          icon: <UpdateIcon />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          label: "Actualizando producto",
        };
      case "complete":
        return {
          icon: <CheckIcon />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          label: "Completado",
        };
      default:
        return {
          icon: <ExtractIcon />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          label: "Procesando",
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 animate-slideUp">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Subiendo Producto
          </h2>
          <p className="text-gray-600 text-sm">
            Por favor espera mientras se procesa el archivo...
          </p>
        </div>

        {/* Phase Indicator */}
        <div className={`bg-neutral-50 rounded-lg p-4 mb-6`}>
          <div className="flex items-center gap-3">
            <div className={"text-neutral-600"}>{phaseInfo.icon}</div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${"text-neutral-600"}`}>
                {phaseInfo.label}
              </p>
              {/* Mostrar mensaje solo si NO estamos en fase de subida de imágenes */}
              {phase !== "uploading-images" && (
                <p className="text-xs text-gray-600 mt-1">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Progreso</span>
            <span className="font-bold text-gray-800">
              {Math.trunc(progress * 100) / 100}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-gray-600 to-gray-800 h-full transition-all duration-300 ease-out rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-start gap-2">
            <InfoIcon />
            <p className="text-sm text-gray-800">
              No cierres esta ventana hasta que se complete la subida
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
