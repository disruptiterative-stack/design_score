"use server";
import { Project } from "@/src/domain/entities/Project";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { ProjectUseCase } from "@/src/domain/usecase/ProjectUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { SupabaseProjectRepository } from "@/src/infrastrucutre/supabse/SupabaseProjectRepository";

/**
 * Crea un nuevo proyecto
 */
export async function createProjectAction(
  projectData: Omit<Project, "admin_id" | "project_id">
): Promise<{ project: Project | null; ok: boolean; error: string | null }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const projectRepository = new SupabaseProjectRepository(client);
    const projectUseCase = new ProjectUseCase(projectRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) {
      return { project: null, ok: false, error: "No authenticated user" };
    }

    // Asignar admin_id automáticamente
    const projectWithAdmin: Project = {
      ...projectData,
      admin_id: admin.id as string,
    } as Project;

    return await projectUseCase.createProject(projectWithAdmin);
  } catch (error) {
    console.error("Error creating project:", error);
    return {
      project: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Obtiene un proyecto por su ID
 */
export async function getProjectByIdAction(
  projectId: string
): Promise<Project | null> {
  try {
    const client = await createClient();
    const projectRepository = new SupabaseProjectRepository(client);
    const projectUseCase = new ProjectUseCase(projectRepository);

    return await projectUseCase.getProjectById(projectId);
  } catch (error) {
    console.error("Error getting project:", error);
    return null;
  }
}

/**
 * Obtiene un proyecto por su ID con sus productos
 */
export async function getProjectByIdWithProductsAction(
  projectId: string
): Promise<Project | null> {
  try {
    const client = await createClient();
    const projectRepository = new SupabaseProjectRepository(client);
    const projectUseCase = new ProjectUseCase(projectRepository);

    return await projectUseCase.getProjectByIdWithProducts(projectId);
  } catch (error) {
    console.error("Error getting project with products:", error);
    return null;
  }
}

/**
 * Obtiene todos los proyectos del administrador autenticado
 */
export async function getAllProjectsAction(): Promise<Project[]> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const projectRepository = new SupabaseProjectRepository(client);
    const projectUseCase = new ProjectUseCase(projectRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return [];

    return await projectUseCase.getProjectsByAdminId(admin.id as string);
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
}

/**
 * Actualiza un proyecto
 */
export async function updateProjectAction(
  projectId: string,
  updates: Partial<Project>
): Promise<{ project: Project | null; ok: boolean; error: string | null }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const projectRepository = new SupabaseProjectRepository(client);
    const projectUseCase = new ProjectUseCase(projectRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) {
      return { project: null, ok: false, error: "No authenticated user" };
    }

    return await projectUseCase.updateProject(projectId, updates);
  } catch (error) {
    console.error("Error updating project:", error);
    return {
      project: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Elimina un proyecto y todos sus recursos relacionados
 * (productos, imágenes en storage, views, view_products)
 */
export async function deleteProjectAction(
  projectId: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) {
      return { ok: false, error: "No authenticated user" };
    }

    // Importar repositorios necesarios para eliminación en cascada
    const { SupabaseStorageRepository } = await import(
      "@/src/infrastrucutre/supabse/SupabaseStorageRepository"
    );
    const { SupabaseProductRepository } = await import(
      "@/src/infrastrucutre/supabse/SupabaseProductRepositry"
    );

    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const projectRepository = new SupabaseProjectRepository(
      client,
      storageRepository,
      productRepository
    );
    const projectUseCase = new ProjectUseCase(projectRepository);

    return await projectUseCase.deleteProject(projectId);
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Obtiene el conteo de proyectos del usuario actual
 */
export async function getProjectsCountAction(): Promise<number> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return 0;

    const { count, error } = await client
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", admin.id);

    if (error) {
      console.error("Error counting projects:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error counting projects:", error);
    return 0;
  }
}
