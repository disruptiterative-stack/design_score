import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icono 404 */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-6xl font-light text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-light text-gray-700 mb-4">
          Acceso No Autorizado
        </h2>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8">
          No tienes permisos para acceder a esta página. Debes iniciar sesión
          para continuar.
        </p>

        {/* Razones comunes */}
        <div className="bg-white rounded-lg p-6 mb-8 text-left shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Posibles razones:
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="2" />
              </svg>
              <span>No has iniciado sesión</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="2" />
              </svg>
              <span>Tu sesión ha expirado</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="2" />
              </svg>
              <span>No tienes permisos de administrador</span>
            </li>
          </ul>
        </div>

        {/* Botón de acción */}
        <div className="flex flex-col gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>Ir a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
