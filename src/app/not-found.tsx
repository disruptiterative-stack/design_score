"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-6xl font-light text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-light text-gray-700 mb-4">
          Página no encontrada
        </h2>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que estás buscando no existe o no tienes
          permisos para acceder a ella.
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
              <span>El administrador no está registrado en el sistema</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="2" />
              </svg>
              <span>La URL es incorrecta o ha sido modificada</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="2" />
              </svg>
              <span>El recurso ha sido eliminado o movido</span>
            </li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors flex items-center justify-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Volver atrás</span>
          </button>

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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Ir al inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
