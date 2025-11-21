import { View } from "../entities/View";
import { Product } from "../entities/Product";

export interface IViewRepository {
  // View CRUD
  createView(
    view: View
  ): Promise<{ view: View | null; ok: boolean; error: string | null }>;
  findById(viewId: string): Promise<View | null>;
  findByProjectId(projectId: string): Promise<View[]>;
  findByProjectIdAndIdx(projectId: string, idx: string): Promise<View | null>;
  updateView(
    viewId: string,
    updates: Partial<View>
  ): Promise<{ view: View | null; ok: boolean; error: string | null }>;
  deleteView(viewId: string): Promise<{ ok: boolean; error: string | null }>;

  // View-Product Relations
  assignProductsToView(
    viewId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error: string | null }>;
  removeProductsFromView(
    viewId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error: string | null }>;
  getProductsByViewId(viewId: string): Promise<Product[]>;
}
