import { SupabaseClient } from "@supabase/supabase-js";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { IViewRepository } from "@/src/domain/ports/IViewRepository";

export class SupabaseViewRepository implements IViewRepository {
  constructor(private supabaseClient: SupabaseClient) {}

  async createView(view: View): Promise<{
    view: View | null;
    ok: boolean;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("views")
      .insert({
        project_id: view.project_id,
        idx: view.idx,
        name: view.name,
      })
      .select()
      .single();

    if (error) {
      return { view: null, ok: false, error: error.message };
    }

    return {
      view: this.mapToView(data),
      ok: true,
      error: null,
    };
  }

  async findById(viewId: string): Promise<View | null> {
    const { data, error } = await this.supabaseClient
      .from("views")
      .select("*")
      .eq("view_id", viewId)
      .single();

    if (error || !data) return null;

    return this.mapToView(data);
  }

  async findByProjectId(projectId: string): Promise<View[]> {
    const { data, error } = await this.supabaseClient
      .from("views")
      .select("*")
      .eq("project_id", projectId)
      .order("idx", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToView(row));
  }

  async findByProjectIdAndIdx(
    projectId: string,
    idx: string
  ): Promise<View | null> {
    const { data, error } = await this.supabaseClient
      .from("views")
      .select("*")
      .eq("project_id", projectId)
      .eq("idx", idx)
      .single();

    if (error || !data) return null;

    return this.mapToView(data);
  }

  async updateView(
    viewId: string,
    updates: Partial<View>
  ): Promise<{
    view: View | null;
    ok: boolean;
    error: string | null;
  }> {
    const updateData: any = {};

    if (updates.idx !== undefined) updateData.idx = updates.idx;
    if (updates.name !== undefined) updateData.name = updates.name;

    const { data, error } = await this.supabaseClient
      .from("views")
      .update(updateData)
      .eq("view_id", viewId)
      .select()
      .single();

    if (error) {
      return { view: null, ok: false, error: error.message };
    }

    return {
      view: this.mapToView(data),
      ok: true,
      error: null,
    };
  }

  async deleteView(viewId: string): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    try {
      // CASCADE eliminará automáticamente los registros en view_products
      const { error: deleteError } = await this.supabaseClient
        .from("views")
        .delete()
        .eq("view_id", viewId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando view:", err.message);
      return { ok: false, error: err.message };
    }
  }

  // ============================================================
  // 🔹 VIEW-PRODUCT OPERATIONS
  // ============================================================

  async assignProductsToView(
    viewId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      // Paso 1: Eliminar todas las asociaciones existentes
      const { error: deleteError } = await this.supabaseClient
        .from("view_products")
        .delete()
        .eq("view_id", viewId);

      if (deleteError) {
        throw new Error(
          `Error removing existing products: ${deleteError.message}`
        );
      }

      // Paso 2: Insertar las nuevas relaciones
      if (productIds.length > 0) {
        const insertData = productIds.map((productId) => ({
          view_id: viewId,
          product_id: productId,
        }));

        const { error: insertError } = await this.supabaseClient
          .from("view_products")
          .insert(insertData);

        if (insertError) {
          throw new Error(
            `Error assigning products to view: ${insertError.message}`
          );
        }
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error asignando productos a view:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async removeProductsFromView(
    viewId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      const { error } = await this.supabaseClient
        .from("view_products")
        .delete()
        .eq("view_id", viewId)
        .in("product_id", productIds);

      if (error) {
        throw new Error(`Error removing products from view: ${error.message}`);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error removiendo productos de view:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async getProductsByViewId(viewId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("view_products")
      .select(
        `
        product_id,
        products (*)
      `
      )
      .eq("view_id", viewId);

    if (error || !data) return [];

    // Extraer y mapear los productos
    return data
      .map((row: any) => row.products)
      .filter((p: any) => p !== null)
      .map((p: any) => this.mapToProduct(p));
  }

  // ============================================================
  // 🔹 MAPPERS (DB -> Domain)
  // ============================================================

  private mapToView(data: any): View {
    return {
      view_id: data.view_id,
      project_id: data.project_id,
      idx: data.idx,
      name: data.name,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  private mapToProduct(data: any): Product {
    return {
      product_id: data.product_id,
      admin_id: data.admin_id,
      name: data.name,
      description: data.description,
      cover_image: data.cover_image,
      constants: data.constants,
      path: data.path,
      weight: parseFloat(data.weight || 0),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
