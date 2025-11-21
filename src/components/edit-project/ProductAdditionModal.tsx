import { useEffect } from "react";
import Button from "@/src/components/ui/Button";

interface ProductAdditionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  productsCount: number;
  onClose: () => void;
}

export function ProductAdditionModal({
  isOpen,
  isLoading,
  error,
  success,
  productsCount,
  onClose,
}: ProductAdditionModalProps) {
  // Cerrar automáticamente cuando sea exitoso
  useEffect(() => {
    if (success && !isLoading && !error) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); // Esperar 1.5 segundos para mostrar el éxito

      return () => clearTimeout(timer);
    }
  }, [success, isLoading, error, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        {/* Contenido durante la carga */}
        {isLoading && (
          <div className="text-center">
            <div className="relative mx-auto mb-6 w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              Agregando Productos
            </h3>
            <p className="text-gray-600">
              Por favor espera mientras se agregan los productos al proyecto...
            </p>
          </div>
        )}

        {/* Contenido cuando hay error */}
        {!isLoading && error && (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              Error al Agregar Productos
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={onClose} variant="primary" className="w-full">
              Cerrar
            </Button>
          </div>
        )}

        {/* Contenido cuando es exitoso */}
        {!isLoading && !error && success && (
          <div className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              ¡Productos Agregados!
            </h3>
            <p className="text-gray-600">
              {productsCount} {productsCount === 1 ? "producto" : "productos"}{" "}
              {productsCount === 1 ? "agregado" : "agregados"} correctamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
