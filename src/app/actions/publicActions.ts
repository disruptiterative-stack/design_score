"use server";

import { createPublicClient } from "@/src/infrastrucutre/supabse/publicClient";
import { SupabaseProjectRepository } from "@/src/infrastrucutre/supabse/SupabaseProjectRepository";
import { SupabaseViewRepository } from "@/src/infrastrucutre/supabse/SupabaseViewRepository";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { Project } from "@/src/domain/entities/Project";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";

/**
 * Obtiene un proyecto público usando su public_key
 */
export async function getPublicProjectAction(
  publicKey: string
): Promise<Project | null> {
  try {
    //console.log("🔍 Buscando proyecto con public_key:", publicKey);
    const supabase = createPublicClient();
    const projectRepo = new SupabaseProjectRepository(supabase);

    const project = await projectRepo.findByPublicKey(publicKey);
    //console.log("📦 Resultado de findByPublicKey:", project);
    return project;
  } catch (error) {
    //console.error("❌ Error obteniendo proyecto público:", error);
    return null;
  }
}

/**
 * Obtiene las vistas de un proyecto público
 */
export async function getPublicViewsAction(projectId: string): Promise<View[]> {
  try {
    const supabase = createPublicClient();
    const viewRepo = new SupabaseViewRepository(supabase);
    console.log("🔍 Buscando vistas públicas para project_id:", projectId);

    const views = await viewRepo.findByProjectId(projectId);
    return views;
  } catch (error) {
    console.error("Error obteniendo vistas públicas:", error);
    return [];
  }
}

/**
 * Obtiene los productos de una vista pública
 */
export async function getPublicProductsByViewAction(
  viewId: string
): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const viewRepo = new SupabaseViewRepository(supabase);

    const products = await viewRepo.getProductsByViewId(viewId);
    return products;
  } catch (error) {
    console.error("Error obteniendo productos públicos:", error);
    return [];
  }
}
