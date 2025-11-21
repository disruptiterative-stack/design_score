import { useState } from "react";
import {
  deleteProductAction,
  addProductToProjectAction,
  removeProductFromProjectAction,
} from "@/src/app/actions/productActions";

/**
 * Hook para manejar los productos de un proyecto
 */
export function useProductManager(projectId: string) {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [newProductName, setNewProductName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductsToAdd, setSelectedProductsToAdd] = useState<string[]>(
    []
  );

  const openAddProductModal = () => {
    setIsAddingProduct(true);
    setNewProductName("");
    setSelectedProductsToAdd([]);
  };

  const closeAddProductModal = () => {
    setIsAddingProduct(false);
    setNewProductName("");
    setSelectedProductsToAdd([]);
  };

  const addProduct = async (productIds?: string[]) => {
    try {
      setIsSaving(true);

      // Usar los productIds pasados o los del estado
      const productsToAdd = productIds || selectedProductsToAdd;

      // Agregar los productos seleccionados al proyecto
      if (productsToAdd.length > 0) {
        const results = await Promise.all(
          productsToAdd.map((productId) =>
            addProductToProjectAction(productId, projectId)
          )
        );

        const hasErrors = results.some((r) => !r.ok);
        if (hasErrors) {
          throw new Error("Error al asociar algunos productos al proyecto");
        }
      }

      closeAddProductModal();
      return productsToAdd.length; // Retornar el número de productos agregados
    } catch (err: any) {
      console.error("Error agregando productos:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const removeProduct = async (productId: string) => {
    try {
      setIsSaving(true);

      const result = await removeProductFromProjectAction(productId, projectId);

      if (!result.ok) {
        throw new Error(
          result.error || "Error al remover producto del proyecto"
        );
      }

      setSelectedProductIndex(-1);
      return result;
    } catch (err: any) {
      console.error("Error removiendo producto del proyecto:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setIsSaving(true);

      const result = await deleteProductAction(productId);

      if (!result.ok) {
        throw new Error(result.error || "Error al eliminar producto");
      }

      setSelectedProductIndex(-1);
      return result;
    } catch (err: any) {
      console.error("Error eliminando producto:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // Estado del modal
    isAddingProduct,
    newProductName,
    setNewProductName,
    openAddProductModal,
    closeAddProductModal,
    selectedProductsToAdd,
    setSelectedProductsToAdd,

    // Producto seleccionado para vista 3D
    selectedProductIndex,
    setSelectedProductIndex,

    // Acciones
    addProduct,
    deleteProduct,
    removeProduct,

    // Estado
    isSaving,
  };
}
