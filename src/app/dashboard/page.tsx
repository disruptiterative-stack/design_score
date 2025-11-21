"use client";

import ProjectCard from "@/src/components/ProjectCard";
import ProductCard from "@/src/components/ProductCard";
import LoadingModal from "@/src/components/LoadingModal";
import DeleteProjectModal from "@/src/components/dashboard/DeleteProjectModal";
import ViewProductModal from "@/src/components/ViewProductModal";
import UploadProgressModal from "@/src/components/dashboard/UploadProgressModal";
import AddProductDialog from "@/src/components/dashboard/AddProductDialog";
import DeleteProductConfirmModal from "@/src/components/dashboard/DeleteProductModal";
import { LoadingScreen } from "@/src/components/LoadingScreen";
import { useDashboard } from "@/src/hooks/useDashboard";
import { useProducts } from "@/src/hooks/useProducts";
import { useProductUpload } from "@/src/hooks/useProductUpload";
import { signOutAction } from "@/src/app/actions/authActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveTab = "projects" | "products";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const productsHook = useProducts();
  const { uploadState, uploadProduct, startUpload } = useProductUpload();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("projects");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToView, setProductToView] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOutAction();
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoggingOut(false);
    }
  };

  const handleCreateProduct = async (
    name: string,
    description: string,
    files: FileList
  ) => {
    if (files.length === 0 || !files[0].name.endsWith(".zip")) {
      alert("Debes seleccionar un archivo ZIP");
      return;
    }

    const zipFile = files[0];

    try {
      // Cerrar el modal de creación Y mostrar inmediatamente el modal de progreso
      setIsAddProductModalOpen(false);
      startUpload(); // Esto mostrará el UploadProgressModal inmediatamente

      // 1. Crear el producto en la base de datos
      const result = await productsHook.createProduct(name, description, []);

      if (!result.ok || !result.product) {
        throw new Error(result.error || "Error al crear producto");
      }

      const productId = result.product.product_id || result.product.id;
      if (!productId) {
        throw new Error("No se obtuvo el ID del producto");
      }

      /*   console.log("✅ Producto creado:", productId); */

      // 2. Subir el archivo ZIP usando el hook
      const uploadResult = await uploadProduct(productId, zipFile);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Error al subir el archivo");
      }

      // 3. Recargar productos
      await productsHook.refreshProducts();
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error creando producto:", err);
      alert(`Error al crear producto: ${err.message}`);
    }
  };

  const handleViewProduct = (productId: string) => {
    setProductToView(productId);
  };

  const handleDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    const result = await productsHook.deleteProduct(productToDelete);
    if (result.ok) {
      /*       console.log("✅ Producto eliminado"); */
      setProductToDelete(null);
    } else {
      // Lanzar error para que el modal lo maneje
      throw new Error(result.error || "Error al eliminar producto");
    }
  };

  const isLoading = dashboard.isLoading || productsHook.isLoading;

  if (isLoading) {
    return (
      <LoadingScreen
        title="Cargando Dashboard"
        subtitle="Preparando tus proyectos y productos..."
        steps={[
          "Cargando proyectos",
          "Obteniendo productos",
          "Preparando interfaz",
        ]}
      />
    );
  }

  if (dashboard.error || productsHook.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-xl">
          {dashboard.error || productsHook.error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-gray-800 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">Gestiona tus proyectos y productos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cerrar sesión"
            >
              <LogoutIcon />
              <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-3 px-2 font-medium transition-colors relative ${
                activeTab === "projects"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Proyectos ({dashboard.projects.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-3 px-2 font-medium transition-colors relative ${
                activeTab === "products"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Productos ({productsHook.products.length})
            </button>
          </div>
        </div>

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div>
            {/* Projects Actions Bar */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex-1" />
              <button
                onClick={dashboard.handleCreateProject}
                className="px-5 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center gap-2"
              >
                <PlusIcon />
                <span>Nuevo Proyecto</span>
              </button>
            </div>

            {/* Projects Gallery */}
            {dashboard.projects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">No tienes proyectos aún</p>
                <p className="text-gray-500 mt-2">
                  Crea tu primer proyecto para comenzar
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {dashboard.projects.map((project) => (
                  <ProjectCard
                    key={project.project_id}
                    project={project}
                    onPlay={dashboard.handlePlay}
                    onInfo={dashboard.handleEdit}
                    onDelete={dashboard.handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            {/* Products Actions Bar */}
            <div className="mb-6 flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar productos por nombre..."
                  value={productsHook.searchTerm}
                  onChange={(e) => productsHook.setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
                <SearchIcon />
              </div>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-5 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center gap-2"
              >
                <PlusIcon />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Products Gallery */}
            {productsHook.filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">
                  {productsHook.searchTerm
                    ? "No se encontraron productos"
                    : "No tienes productos aún"}
                </p>
                <p className="text-gray-500 mt-2">
                  {productsHook.searchTerm
                    ? "Intenta con otro término de búsqueda"
                    : "Crea tu primer producto para comenzar"}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                {productsHook.filteredProducts.map((product) => (
                  <ProductCard
                    key={product.product_id || product.id}
                    product={product}
                    onView={handleViewProduct}
                    onDelete={handleDeleteProduct}
                    onNameUpdated={productsHook.refreshProducts}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteProjectModal
        isOpen={dashboard.modalOpen}
        projectName={dashboard.pendingProject?.name || ""}
        numProducts={dashboard.pendingProject?.numProducts || 0}
        onConfirm={dashboard.handleModalConfirm}
        onCancel={dashboard.handleModalCancel}
      />

      <LoadingModal
        isOpen={dashboard.isDeleting}
        progress={dashboard.deleteProgress}
        message={dashboard.deleteMessage}
        title="Eliminando proyecto..."
      />

      <AddProductDialog
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSubmit={handleCreateProduct}
      />

      {/* Upload Progress Modal */}
      <UploadProgressModal
        isOpen={uploadState.isUploading}
        progress={uploadState.progress}
        message={uploadState.message}
        filesUploaded={uploadState.filesUploaded}
        totalFiles={uploadState.totalFiles}
        currentFileName={uploadState.currentFileName}
        phase={uploadState.phase}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteProductConfirmModal
        key={productToDelete} // Esto resetea el componente cada vez que cambia el producto
        isOpen={productToDelete !== null}
        onConfirm={confirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
        productId={productToDelete}
      />

      {/* View Product Modal */}
      <ViewProductModal
        isOpen={productToView !== null}
        onClose={() => setProductToView(null)}
        productId={productToView}
      />
    </div>
  );
}

// Icono Plus SVG
function PlusIcon() {
  return (
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
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

// Icono Logout SVG
function LogoutIcon() {
  return (
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
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

// Icono Search SVG
function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
