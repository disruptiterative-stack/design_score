import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { IViewRepository } from "@/src/domain/ports/IViewRepository";

export class ViewUseCase {
  constructor(private viewRepository: IViewRepository) {}

  async createView(view: View): Promise<{
    view: View | null;
    ok: boolean;
    error: string | null;
  }> {
    // Validaciones
    if (!view.project_id || view.project_id.trim() === "") {
      return {
        view: null,
        ok: false,
        error: "project_id es requerido",
      };
    }

    if (!view.idx || view.idx.trim() === "") {
      return {
        view: null,
        ok: false,
        error: "idx es requerido",
      };
    }

    // Verificar que no exista otra view con el mismo idx en el mismo proyecto
    const existingView = await this.viewRepository.findByProjectIdAndIdx(
      view.project_id,
      view.idx
    );

    if (existingView) {
      return {
        view: null,
        ok: false,
        error: `Ya existe una vista con idx '${view.idx}' en este proyecto`,
      };
    }

    return await this.viewRepository.createView(view);
  }

  async getViewById(viewId: string): Promise<View | null> {
    if (!viewId || viewId.trim() === "") {
      return null;
    }

    return await this.viewRepository.findById(viewId);
  }

  async getViewsByProjectId(projectId: string): Promise<View[]> {
    if (!projectId || projectId.trim() === "") {
      return [];
    }

    return await this.viewRepository.findByProjectId(projectId);
  }

  async getViewByProjectIdAndIdx(
    projectId: string,
    idx: string
  ): Promise<View | null> {
    if (!projectId || projectId.trim() === "" || !idx || idx.trim() === "") {
      return null;
    }

    return await this.viewRepository.findByProjectIdAndIdx(projectId, idx);
  }

  async updateView(
    viewId: string,
    updates: Partial<View>
  ): Promise<{
    view: View | null;
    ok: boolean;
    error: string | null;
  }> {
    if (!viewId || viewId.trim() === "") {
      return {
        view: null,
        ok: false,
        error: "viewId es requerido",
      };
    }

    // Verificar que la view existe
    const existingView = await this.viewRepository.findById(viewId);
    if (!existingView) {
      return {
        view: null,
        ok: false,
        error: "View no encontrada",
      };
    }

    // Si se intenta actualizar idx, verificar que no exista otra view con ese idx
    if (updates.idx && updates.idx !== existingView.idx) {
      const viewWithSameIdx = await this.viewRepository.findByProjectIdAndIdx(
        existingView.project_id,
        updates.idx
      );

      if (viewWithSameIdx) {
        return {
          view: null,
          ok: false,
          error: `Ya existe una vista con idx '${updates.idx}' en este proyecto`,
        };
      }
    }

    return await this.viewRepository.updateView(viewId, updates);
  }

  async deleteView(viewId: string): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    if (!viewId || viewId.trim() === "") {
      return {
        ok: false,
        error: "viewId es requerido",
      };
    }

    // Verificar que la view existe
    const existingView = await this.viewRepository.findById(viewId);
    if (!existingView) {
      return {
        ok: false,
        error: "View no encontrada",
      };
    }

    return await this.viewRepository.deleteView(viewId);
  }

  // ============================================================
  // 🔹 VIEW-PRODUCT OPERATIONS
  // ============================================================

  async assignProductsToView(
    viewId: string,
    productIds: string[]
  ): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    if (!viewId || viewId.trim() === "") {
      return {
        ok: false,
        error: "viewId es requerido",
      };
    }

    // Verificar que la view existe
    const existingView = await this.viewRepository.findById(viewId);
    if (!existingView) {
      return {
        ok: false,
        error: "View no encontrada",
      };
    }

    // Si productIds está vacío, eliminar todos los productos de la vista
    if (!productIds || productIds.length === 0) {
      // Obtener todos los productos actuales de la vista
      const currentProducts = await this.viewRepository.getProductsByViewId(
        viewId
      );

      if (currentProducts.length > 0) {
        // Eliminar todos los productos de la vista
        const currentProductIds = currentProducts.map((p) => p.product_id!);
        return await this.viewRepository.removeProductsFromView(
          viewId,
          currentProductIds
        );
      }

      // Si no hay productos, retornar éxito
      return {
        ok: true,
        error: null,
      };
    }

    return await this.viewRepository.assignProductsToView(viewId, productIds);
  }

  async removeProductsFromView(
    viewId: string,
    productIds: string[]
  ): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    if (!viewId || viewId.trim() === "") {
      return {
        ok: false,
        error: "viewId es requerido",
      };
    }

    if (!productIds || productIds.length === 0) {
      return {
        ok: false,
        error: "Debe proporcionar al menos un product_id",
      };
    }

    return await this.viewRepository.removeProductsFromView(viewId, productIds);
  }

  async getProductsByViewId(viewId: string): Promise<Product[]> {
    if (!viewId || viewId.trim() === "") {
      return [];
    }

    return await this.viewRepository.getProductsByViewId(viewId);
  }
}
