"use server";

import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseViewRepository } from "@/src/infrastrucutre/supabse/SupabaseViewRepository";
import { ViewUseCase } from "@/src/domain/usecase/ViewUseCase";

// ============================================================
// 🔹 CREATE VIEW
// ============================================================
export async function createViewAction(
  project_id: string,
  idx: string,
  name?: string
): Promise<{
  view: View | null;
  ok: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { view: null, ok: false, error: "Usuario no autenticado" };
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    const newView: View = {
      view_id: "",
      project_id,
      idx,
      name: name || `Vista ${parseInt(idx, 10) + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await viewUseCase.createView(newView);
  } catch (error: any) {
    console.error("Error en createViewAction:", error.message);
    return { view: null, ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 GET VIEW BY ID
// ============================================================
export async function getViewByIdAction(viewId: string): Promise<View | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.getViewById(viewId);
  } catch (error: any) {
    console.error("Error en getViewByIdAction:", error.message);
    return null;
  }
}

// ============================================================
// 🔹 GET VIEWS BY PROJECT ID
// ============================================================
export async function getViewsByProjectIdAction(
  projectId: string
): Promise<View[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.getViewsByProjectId(projectId);
  } catch (error: any) {
    console.error("Error en getViewsByProjectIdAction:", error.message);
    return [];
  }
}

// ============================================================
// 🔹 GET VIEW BY PROJECT ID AND IDX
// ============================================================
export async function getViewByProjectIdAndIdxAction(
  projectId: string,
  idx: string
): Promise<View | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.getViewByProjectIdAndIdx(projectId, idx);
  } catch (error: any) {
    console.error("Error en getViewByProjectIdAndIdxAction:", error.message);
    return null;
  }
}

// ============================================================
// 🔹 UPDATE VIEW
// ============================================================
export async function updateViewAction(
  viewId: string,
  updates: Partial<View>
): Promise<{
  view: View | null;
  ok: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { view: null, ok: false, error: "Usuario no autenticado" };
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.updateView(viewId, updates);
  } catch (error: any) {
    console.error("Error en updateViewAction:", error.message);
    return { view: null, ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 DELETE VIEW
// ============================================================
export async function deleteViewAction(viewId: string): Promise<{
  ok: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Usuario no autenticado" };
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.deleteView(viewId);
  } catch (error: any) {
    console.error("Error en deleteViewAction:", error.message);
    return { ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 ASSIGN PRODUCTS TO VIEW
// ============================================================
export async function assignProductsToViewAction(
  viewId: string,
  productIds: string[]
): Promise<{
  ok: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Usuario no autenticado" };
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.assignProductsToView(viewId, productIds);
  } catch (error: any) {
    console.error("Error en assignProductsToViewAction:", error.message);
    return { ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 REMOVE PRODUCTS FROM VIEW
// ============================================================
export async function removeProductsFromViewAction(
  viewId: string,
  productIds: string[]
): Promise<{
  ok: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Usuario no autenticado" };
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.removeProductsFromView(viewId, productIds);
  } catch (error: any) {
    console.error("Error en removeProductsFromViewAction:", error.message);
    return { ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 GET PRODUCTS BY VIEW ID
// ============================================================
export async function getProductsByViewIdAction(
  viewId: string
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    return await viewUseCase.getProductsByViewId(viewId);
  } catch (error: any) {
    console.error("Error en getProductsByViewIdAction:", error.message);
    return [];
  }
}

// ============================================================
// 🔹 GET VIEWS COUNT (FOR PAGINATION/STATS)
// ============================================================
export async function getViewsCountAction(projectId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 0;
    }

    const viewRepository = new SupabaseViewRepository(supabase);
    const viewUseCase = new ViewUseCase(viewRepository);

    const views = await viewUseCase.getViewsByProjectId(projectId);
    return views.length;
  } catch (error: any) {
    console.error("Error en getViewsCountAction:", error.message);
    return 0;
  }
}
