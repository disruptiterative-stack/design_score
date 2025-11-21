import { SupabaseClient } from "@supabase/supabase-js";
import { Project } from "@/src/domain/entities/Project";
import { Product } from "@/src/domain/entities/Product";
import { IProjectRepository } from "@/src/domain/ports/IProjectRepository";
import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import { IProductRepository } from "@/src/domain/ports/IProductRepository";

export class SupabaseProjectRepository implements IProjectRepository {
  constructor(
    private supabaseClient: SupabaseClient,
    private storageRepository?: IStorageRepository,
    private productRepository?: IProductRepository
  ) {}

  async createProject(project: Project): Promise<{
    project: Project | null;
    ok: boolean;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .insert({
        admin_id: project.admin_id,
        name: project.name,
        final_message: project.final_message,
      })
      .select()
      .single();

    if (error) {
      return { project: null, ok: false, error: error.message };
    }

    return {
      project: this.mapToProject(data),
      ok: true,
      error: null,
    };
  }

  async findById(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (error || !data) return null;

    return this.mapToProject(data);
  }

  async findByIdWithProducts(projectId: string): Promise<Project | null> {
    // Obtener el proyecto
    const { data: projectData, error: projectError } = await this.supabaseClient
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (projectError || !projectData) return null;

    const project = this.mapToProject(projectData);

    // Obtener productos a través de la tabla intermedia
    const { data: projectProductsData, error: ppError } =
      await this.supabaseClient
        .from("project_products")
        .select("product_id")
        .eq("project_id", projectId);

    if (ppError || !projectProductsData || projectProductsData.length === 0) {
      project.num_products = 0;
      project.size = 0;
      return project;
    }

    // Obtener los productos completos verificando que pertenecen al admin del proyecto
    const productIds = projectProductsData.map((pp) => pp.product_id);
    const { data: productsData, error: productsError } =
      await this.supabaseClient
        .from("products")
        .select("*")
        .in("product_id", productIds)
        .eq("admin_id", project.admin_id);

    if (!productsError && productsData) {
      project.products = productsData.map((p: any) => this.mapToProduct(p));

      // Calcular número de productos
      project.num_products = project.products.length;

      // Calcular tamaño total en MB
      project.size = project.products.reduce((total, product) => {
        return total + (product.weight || 0);
      }, 0);
    } else {
      project.num_products = 0;
      project.size = 0;
    }

    return project;
  }

  async findByAdminId(adminId: string): Promise<Project[]> {
    // Obtener proyectos del admin
    const { data, error } = await this.supabaseClient
      .from("projects")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    // Para cada proyecto, obtener sus productos
    const projectsWithProducts = await Promise.all(
      data.map(async (row: any) => {
        const project = this.mapToProject(row);

        // Obtener productos del proyecto a través de la tabla intermedia
        const { data: projectProductsData, error: ppError } =
          await this.supabaseClient
            .from("project_products")
            .select("product_id")
            .eq("project_id", project.project_id);

        if (
          ppError ||
          !projectProductsData ||
          projectProductsData.length === 0
        ) {
          project.products = [];
          project.num_products = 0;
          project.size = 0;
        } else {
          // Obtener los productos completos verificando que pertenecen al admin
          const productIds = projectProductsData.map((pp) => pp.product_id);
          const { data: productsData, error: productsError } =
            await this.supabaseClient
              .from("products")
              .select("*")
              .in("product_id", productIds)
              .eq("admin_id", adminId);

          if (!productsError && productsData) {
            project.products = productsData.map((p: any) =>
              this.mapToProduct(p)
            );

            // Calcular número de productos
            project.num_products = project.products.length;

            // Calcular tamaño total en MB
            project.size = project.products.reduce((total, product) => {
              return total + (product.weight || 0);
            }, 0);
          } else {
            project.products = [];
            project.num_products = 0;
            project.size = 0;
          }
        }

        return project;
      })
    );

    return projectsWithProducts;
  }

  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<{
    project: Project | null;
    ok: boolean;
    error: string | null;
  }> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.final_message !== undefined)
      updateData.final_message = updates.final_message;

    const { data, error } = await this.supabaseClient
      .from("projects")
      .update(updateData)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      return { project: null, ok: false, error: error.message };
    }

    return {
      project: this.mapToProject(data),
      ok: true,
      error: null,
    };
  }

  async deleteProject(projectId: string): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    try {
      // 1. Obtener todos los productos del proyecto para eliminar sus imágenes
      if (this.productRepository && this.storageRepository) {
        // Obtener el admin_id del proyecto primero
        const { data: projectData } = await this.supabaseClient
          .from("projects")
          .select("admin_id")
          .eq("project_id", projectId)
          .single();

        const { data: projectProductsData, error: projectProductsError } =
          await this.supabaseClient
            .from("project_products")
            .select("product_id")
            .eq("project_id", projectId);

        if (projectProductsError) {
          console.error(
            "❌ Error al obtener productos:",
            projectProductsError.message
          );
        }

        // 2. Obtener detalles de productos para eliminar sus carpetas
        if (projectProductsData && projectProductsData.length > 0) {
          const productIds = projectProductsData.map((pp) => pp.product_id);

          const { data: productsData, error: productsError } =
            await this.supabaseClient
              .from("products")
              .select("product_id, admin_id, path")
              .in("product_id", productIds)
              .eq("admin_id", projectData?.admin_id);

          if (productsError) {
            console.error(
              "❌ Error al obtener productos:",
              productsError.message
            );
          }

          // 3. Eliminar las carpetas de imágenes de cada producto
          if (productsData && productsData.length > 0) {
            for (const product of productsData) {
              if (product.path) {
                // Eliminar la carpeta completa del producto
                const { ok, error } = await this.storageRepository.deleteFolder(
                  product.path
                );

                if (!ok) {
                  console.error(
                    `❌ Error eliminando carpeta ${product.path}:`,
                    error
                  );
                }
              }

              // También intentar eliminar carpeta por admin_id/product_id si existe
              const fallbackPath = `${product.admin_id}/${product.product_id}`;
              const { ok: fallbackOk, error: fallbackError } =
                await this.storageRepository.deleteFolder(fallbackPath);

              if (!fallbackOk && fallbackError) {
                console.error(
                  `❌ Error eliminando carpeta fallback ${fallbackPath}:`,
                  fallbackError
                );
              }
            }
          }
        }
      }

      // 4. Eliminar el proyecto (CASCADE eliminará automáticamente project_products, views, view_products)
      const { error: deleteError } = await this.supabaseClient
        .from("projects")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("❌ Error eliminando proyecto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  // Método helper para mapear datos de DB a la entidad Project
  private mapToProject(data: any): Project {
    return {
      project_id: data.project_id,
      admin_id: data.admin_id,
      name: data.name,
      num_products: data.num_products || 0,
      final_message: data.final_message,
      created_at: data.created_at,
      updated_at: data.updated_at,
      products: [], // Se llena por separado si es necesario
    };
  }

  // Método helper para mapear datos de DB a la entidad Product
  private mapToProduct(data: any): Product {
    // Parsear weight correctamente, manejando string, number o null
    let weight = 0;
    if (data.weight !== null && data.weight !== undefined) {
      if (typeof data.weight === "string") {
        weight = parseFloat(data.weight);
      } else if (typeof data.weight === "number") {
        weight = data.weight;
      }
    }

    return {
      product_id: data.product_id,
      admin_id: data.admin_id,
      name: data.name,
      description: data.description,
      cover_image: data.cover_image,
      constants: data.constants,
      path: data.path,
      weight: weight,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
