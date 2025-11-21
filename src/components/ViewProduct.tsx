"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { getAllProductsAction } from "../app/actions/productActions";
import { Product } from "../domain/entities/Product";
import { getViewerBaseUrl } from "../lib/getViewerBaseUrl";

// Importación dinámica del visor KeyShot XR para evitar SSR
const KeyShotXRViewer = dynamic(() => import("../components/KeyShotXRViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Cargando visor 3D...</p>
    </div>
  ),
});

interface ViewProductProps {
  adminId?: string;
}

export default function ViewProduct({ adminId }: ViewProductProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setProducts([]); // Limpiar productos anteriores
      setSelectedProduct(null); // Limpiar producto seleccionado
      const allProducts = await getAllProductsAction();
      setProducts(allProducts || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Memoizar la selección inicial para evitar re-renders
  const initialProduct = useMemo(() => products[0] || null, [products]);

  useEffect(() => {
    if (!selectedProduct && initialProduct) {
      setSelectedProduct(initialProduct);
    }
  }, [initialProduct, selectedProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando productos...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">
            No hay productos disponibles
          </p>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
  /*   console.log("Productos cargados:", selectedProduct); */

  return (
    <div className="h-screen flex flex-col">
      {/* Selector de productos */}
      <div className="p-4 bg-gray-100 border-b border-gray-300">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Seleccionar Producto:
          </label>
          <select
            value={selectedProduct?.id || ""}
            onChange={(e) => {
              const product = products.find((p) => p.id === e.target.value);
              setSelectedProduct(product || null);
            }}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.num_images || 0} imágenes,{" "}
                {((product.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </option>
            ))}
          </select>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Recargar
          </button>
        </div>
      </div>
      {/* Visor 3D */}
      {selectedProduct && selectedProduct.constants && (
        <div className="flex-1 overflow-hidden">
          <KeyShotXRViewer
            config={
              typeof selectedProduct.constants === "string"
                ? JSON.parse(selectedProduct.constants)
                : (selectedProduct.constants as Record<string, unknown>)
            }
            baseUrl={getViewerBaseUrl(selectedProduct)}
          />
        </div>
      )}
    </div>
  );
}
