/**
 * Componente de pantalla de carga reutilizable
 * Para usar en diferentes páginas de la aplicación
 */

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

export function LoadingScreen({
  title = "Cargando",
  subtitle = "Preparando la información...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-12 max-w-md w-full">
        <div className="text-center">
          {/* Spinner animado */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
          </div>

          {/* Texto de carga */}
          <h2 className="text-2xl font-light text-gray-800 mb-3">{title}</h2>
          <p className="text-gray-600 mb-4">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
