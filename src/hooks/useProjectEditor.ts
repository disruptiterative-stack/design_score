import { useEffect, useState } from "react";
import { useProjectData } from "./useProjectData";
import { useProjectViewsManager } from "./useProjectViewsManager";
import { useProductManager } from "./useProductManager";
import { useProjectInfoEditor } from "./useProjectInfoEditor";
import { getProjectByIdWithProductsAction } from "@/src/app/actions/projectActions";

/**
 * Hook principal que orquesta toda la lógica de edición de proyecto
 */
export function useProjectEditor(projectId: string) {
  // Estado del proyecto
  const projectData = useProjectData(projectId);

  // Editor de información
  const infoEditor = useProjectInfoEditor(
    projectId,
    projectData.project?.name || "",
    projectData.project?.final_message || ""
  );

  // Gestor de vistas
  const viewsManager = useProjectViewsManager(projectId);

  // Gestor de productos
  const productManager = useProductManager(projectId);

  // Estado del modal de creación de vista
  const [viewCreationModal, setViewCreationModal] = useState({
    isOpen: false,
    isLoading: false,
    error: null as string | null,
    success: false,
  });

  // Estado del modal de eliminación de vista
  const [viewDeletionModal, setViewDeletionModal] = useState({
    isOpen: false,
    isLoading: false,
    error: null as string | null,
    success: false,
    viewId: null as string | null,
    viewName: "",
  });

  // Estado del modal de agregación de productos
  const [productAdditionModal, setProductAdditionModal] = useState({
    isOpen: false,
    isLoading: false,
    error: null as string | null,
    success: false,
    productsCount: 0,
  });

  // Actualizar el editor de info cuando cambie el proyecto
  useEffect(() => {
    if (projectData.project) {
      infoEditor.setName(projectData.project.name || "");
      infoEditor.setFinalMessage(projectData.project.final_message || "");
    }
  }, [projectData.project]);

  // Manejar submit de información
  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updatedProject = await infoEditor.updateInfo();
      projectData.setProject(updatedProject);
      alert("✅ Proyecto actualizado correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar toggle de producto en vista
  const handleToggleProductInView = async (
    viewId: string,
    productId: string
  ) => {
    try {
      await viewsManager.toggleProductInView(viewId, productId);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar agregar vista
  const handleAddView = async () => {
    // Abrir modal en estado de carga
    setViewCreationModal({
      isOpen: true,
      isLoading: true,
      error: null,
      success: false,
    });

    try {
      await viewsManager.addView();

      // Mostrar éxito
      setViewCreationModal({
        isOpen: true,
        isLoading: false,
        error: null,
        success: true,
      });
    } catch (err: any) {
      // Mostrar error
      setViewCreationModal({
        isOpen: true,
        isLoading: false,
        error: err.message || "Error al crear vista",
        success: false,
      });
    }
  };

  // Cerrar modal de creación de vista
  const closeViewCreationModal = () => {
    setViewCreationModal({
      isOpen: false,
      isLoading: false,
      error: null,
      success: false,
    });
  };

  // Manejar eliminar vista (abrir modal de confirmación)
  const handleDeleteView = async (viewId: string) => {
    const view = viewsManager.views.find((v) => v.view_id === viewId);
    const viewName = view?.name || `Vista ${parseInt(view?.idx || "0") + 1}`;

    setViewDeletionModal({
      isOpen: true,
      isLoading: false,
      error: null,
      success: false,
      viewId,
      viewName,
    });
  };

  // Confirmar eliminación de vista
  const confirmDeleteView = async () => {
    if (!viewDeletionModal.viewId) return;

    setViewDeletionModal({
      ...viewDeletionModal,
      isLoading: true,
      error: null,
    });

    try {
      await viewsManager.deleteView(viewDeletionModal.viewId);

      setViewDeletionModal({
        ...viewDeletionModal,
        isLoading: false,
        success: true,
      });
    } catch (err: any) {
      setViewDeletionModal({
        ...viewDeletionModal,
        isLoading: false,
        error: err.message || "Error al eliminar vista",
      });
    }
  };

  // Cancelar eliminación de vista
  const cancelDeleteView = () => {
    setViewDeletionModal({
      isOpen: false,
      isLoading: false,
      error: null,
      success: false,
      viewId: null,
      viewName: "",
    });
  };

  // Cerrar modal de eliminación
  const closeViewDeletionModal = () => {
    setViewDeletionModal({
      isOpen: false,
      isLoading: false,
      error: null,
      success: false,
      viewId: null,
      viewName: "",
    });
  };

  // Manejar agregar producto
  const handleAddProduct = async (productIds: string[]) => {
    const productsCount = productIds.length;

    setProductAdditionModal({
      isOpen: true,
      isLoading: true,
      error: null,
      success: false,
      productsCount,
    });

    try {
      await productManager.addProduct(productIds);

      // Recargar proyecto completo
      const updatedProject = await getProjectByIdWithProductsAction(projectId);
      if (updatedProject) {
        projectData.setProject(updatedProject);
        await viewsManager.reloadViewProducts();
      }

      setProductAdditionModal({
        isOpen: true,
        isLoading: false,
        error: null,
        success: true,
        productsCount,
      });
    } catch (err: any) {
      setProductAdditionModal({
        isOpen: true,
        isLoading: false,
        error: err.message || "Error al agregar productos",
        success: false,
        productsCount,
      });
    }
  };

  // Cerrar modal de agregación de productos
  const closeProductAdditionModal = () => {
    setProductAdditionModal({
      isOpen: false,
      isLoading: false,
      error: null,
      success: false,
      productsCount: 0,
    });
  };

  // Manejar eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    const confirmed = confirm(
      "¿Estás seguro de remover este producto del proyecto?"
    );
    if (!confirmed) return;

    try {
      await productManager.removeProduct(productId);

      // Recargar proyecto completo
      const updatedProject = await getProjectByIdWithProductsAction(projectId);
      if (updatedProject) {
        projectData.setProject(updatedProject);
        await viewsManager.reloadViewProducts();
      }

      alert("✅ Producto removido del proyecto correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  return {
    // Estado del proyecto
    project: projectData.project,
    products: projectData.products,
    isLoading: projectData.isLoading,
    error: projectData.error,
    getTotalWeight: projectData.getTotalWeight,

    // Editor de información
    name: infoEditor.name,
    setName: infoEditor.setName,
    finalMessage: infoEditor.finalMessage,
    setFinalMessage: infoEditor.setFinalMessage,
    isSavingInfo: infoEditor.isSaving,
    handleSubmitInfo,

    // Vistas
    views: viewsManager.views,
    viewProducts: viewsManager.viewProducts,
    handleToggleProductInView,
    handleAddView,
    handleDeleteView,
    viewCreationModal,
    closeViewCreationModal,
    viewDeletionModal,
    confirmDeleteView,
    cancelDeleteView,
    closeViewDeletionModal,
    updateViewName: viewsManager.updateViewName,

    // Productos
    isAddingProduct: productManager.isAddingProduct,
    newProductName: productManager.newProductName,
    setNewProductName: productManager.setNewProductName,
    openAddProductModal: productManager.openAddProductModal,
    closeAddProductModal: productManager.closeAddProductModal,
    selectedProductIndex: productManager.selectedProductIndex,
    setSelectedProductIndex: productManager.setSelectedProductIndex,
    isSavingProduct: productManager.isSaving,
    selectedProductsToAdd: productManager.selectedProductsToAdd,
    setSelectedProductsToAdd: productManager.setSelectedProductsToAdd,
    handleAddProduct,
    handleDeleteProduct,
    productAdditionModal,
    closeProductAdditionModal,
  };
}
