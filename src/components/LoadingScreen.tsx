/**
 * Componente de pantalla de carga reutilizable
 * Para usar en diferentes páginas de la aplicación
 */

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
}

export function LoadingScreen({
  title = "Cargando",
  subtitle = "Preparando la información...",
  steps = [
    "Cargando información del proyecto",
    "Obteniendo productos",
    "Preparando vistas",
  ],
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-12 max-w-md w-full">
        <div className="text-center">
          {/* Spinner animado */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-transparent animate-spin"></div>
            <div
              className="absolute inset-3 rounded-full border-4 border-gray-400 border-b-transparent animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>

          {/* Texto de carga */}
          <h2 className="text-2xl font-light text-gray-800 mb-3">{title}</h2>
          <p className="text-gray-600 mb-4">{subtitle}</p>

          {/* Barra de progreso indeterminada */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gray-800 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>

          {/* Indicadores de estado */}
          <div className="mt-6 space-y-2 text-left">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <div
                  className="w-2 h-2 bg-gray-800 rounded-full mr-2 animate-pulse"
                  style={{ animationDelay: `${index * 0.2}s` }}
                ></div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
