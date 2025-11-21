"use client";

interface LoadingModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  title?: string; // Título personalizable
}

export default function LoadingModal({
  isOpen,
  progress,
  message,
  title = "Subiendo archivos...", // Título por defecto
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Spinner */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
          </div>

          {/* Mensaje */}
          <h3 className="text-xl font-medium text-gray-800 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6 min-h-[72px] text-sm leading-relaxed">
            {message || "Procesando..."}
          </p>

          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-gray-700 to-gray-900 h-3 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Progreso total</p>
            <p className="text-lg font-semibold text-gray-800">
              {Math.round(progress)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
