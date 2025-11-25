"use client";

import { useParams, notFound } from "next/navigation";
import { usePublicProjectViewer } from "@/src/hooks/usePublicProjectViewer";
import { useModelPreloader } from "@/src/hooks/useModelPreloader";
import OptimizedViewerPool from "@/src/components/OptimizedViewerPool";
import { LoadingScreen } from "@/src/components/LoadingScreen";
import { useEffect } from "react";

export default function PublicProjectViewerPage() {
  const params = useParams();
  const publicKey = params.key as string;
  const viewer = usePublicProjectViewer(publicKey);

  // Pre-cargar todos los modelos
  const preloader = useModelPreloader(viewer.views, viewer.allProducts);

  // Si hay un error que indica que el proyecto no existe, mostrar 404
  useEffect(() => {
    if (
      viewer.error &&
      (viewer.error.includes("no encontrado") ||
        viewer.error.includes("no existe") ||
        viewer.error.includes("not found") ||
        viewer.error.includes("no público") ||
        viewer.error.includes("no disponible"))
    ) {
      notFound();
    }
  }, [viewer.error]);

  if (viewer.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black text-xl">{viewer.error}</div>
      </div>
    );
  }

  // Mostrar pantalla de pre-carga de modelos
  if (preloader.isPreloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Cargando Modelos 3D
            </h2>
            <p className="text-gray-600">
              {preloader.progress.currentProduct || "Preparando..."}
            </p>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-black h-4 transition-all duration-300 ease-out"
                style={
                  {
                    width: `${preloader.progress.percentage}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {preloader.progress.loadedProducts} de{" "}
              {preloader.progress.totalProducts} modelos
            </span>
            <span className="font-semibold">
              {preloader.progress.percentage}%
            </span>
          </div>

          <div className="flex justify-center mt-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje final si ya se completaron todas las vistas
  if (viewer.showFinalMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-12 text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Recorrido Completado!
          </h1>
          {viewer.project?.final_message && (
            <div className="text-lg text-gray-700 mb-8 whitespace-pre-wrap">
              {viewer.project.final_message}
            </div>
          )}
          <button
            onClick={viewer.handleRestart}
            className="px-6 py-3 bg-gray-800 hover:bg-black text-white rounded-lg transition-colors font-medium"
          >
            Ver de Nuevo
          </button>
        </div>
      </div>
    );
  }

  // Renderizar vista actual
  const currentView = viewer.currentView;
  const products = viewer.currentProducts;

  if (!currentView || products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-black text-xl">
          No hay productos para mostrar en esta vista
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Header con nombre del proyecto y vista */}
      <div className="text-white p-4 bg-white z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{viewer.project?.name}</p>
            <p className="text-black text-[20px] mt-1">{currentView.name}</p>
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 w-full overflow-hidden bg-white">
        <OptimizedViewerPool
          currentProducts={products}
          nextProducts={[]}
          currentViewIndex={viewer.currentViewIndex}
          gridCols={
            products.length === 1
              ? 1
              : products.length === 2
              ? 2
              : products.length === 3
              ? 3
              : 4
          }
        />
      </div>

      {/* Footer con navegación */}
      <div className="text-white p-6 shadow-lg bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Botón Anterior a la izquierda */}
          <div>
            {viewer.hasPreviousView && (
              <button
                onClick={viewer.handlePreviousView}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                ← Anterior
              </button>
            )}
          </div>

          {/* Contador de vistas */}
          <div className="text-gray-600 text-sm">
            Vista {viewer.currentViewIndex + 1} de {viewer.totalViews}
          </div>

          {/* Botón Siguiente/Finalizar a la derecha */}
          <div>
            <button
              onClick={viewer.handleNextView}
              className="px-6 py-2 text-black border-1 hover:text-white hover:bg-black rounded transition-colors font-medium"
            >
              {viewer.hasNextView ? "Siguiente →" : "Finalizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
