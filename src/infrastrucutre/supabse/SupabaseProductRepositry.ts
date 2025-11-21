import { Product } from "@/src/domain/entities/Product";
import { IProductRepository } from "@/src/domain/ports/IProductRepository";
import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseProductRepository implements IProductRepository {
  constructor(
    private supabaseClient: SupabaseClient,
    private storageRepository: IStorageRepository
  ) {}

  async createProduct(
    product: Product
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .insert({
        admin_id: product.admin_id,
        name: product.name,
        description: product.description,
        cover_image: product.cover_image,
        constants: product.constants,
        path: product.path,
        weight: product.weight || 0,
      })
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }

    return {
      product: this.mapToProduct(data),
      ok: true,
      error: null,
    };
  }

  async addImageToProduct(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage: boolean = false
  ): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    try {
      /*    console.log(
        `📸 [SupabaseProductRepository] Agregando imagen a producto ${productId}:`,
        {
          fileName: image.name,
          fileSize: `${(image.size / 1024).toFixed(2)} KB`,
          isFirstImage,
        }
      ); */

      // --- Subir archivo a Storage usando admin_id y product_id ---
      const path = `${adminId}/${productId}/${image.name}`;
      /*       console.log(`📂 [SupabaseProductRepository] Ruta de subida: ${path}`);
       */
      const { data: uploadData, error: uploadError } =
        await this.storageRepository.uploadFile(path, image);

      if (uploadError || !uploadData) {
        console.error(
          `❌ [SupabaseProductRepository] Error en uploadFile:`,
          uploadError
        );
        throw new Error(uploadError || "Error al subir imagen al Storage");
      }

      /*       console.log(`✅ [SupabaseProductRepository] Archivo subido a storage`);
       */
      const { url } = await this.storageRepository.getFileUrl(path);
      /*       console.log(`🔗 [SupabaseProductRepository] URL pública: ${url}`);
       */
      // --- Si es la primera imagen, actualizar cover_image ---
      if (isFirstImage) {
        /*         console.log(
          `🖼️ [SupabaseProductRepository] Actualizando cover_image del producto`
        ); */
        const { error: updateError } = await this.supabaseClient
          .from("products")
          .update({ cover_image: url })
          .eq("product_id", productId);

        if (updateError) {
          console.error(
            `❌ [SupabaseProductRepository] Error actualizando cover_image:`,
            updateError
          );
          throw new Error(
            `Error actualizando cover_image: ${updateError.message}`
          );
        }
        /*         console.log(`✅ [SupabaseProductRepository] cover_image actualizado`);
         */
      }

      /*       console.log(
        `✅ [SupabaseProductRepository] Imagen agregada exitosamente`
      ); */
      return {
        ok: true,
        error: null,
      };
    } catch (err: any) {
      console.error(
        "❌ [SupabaseProductRepository] Error agregando imagen:",
        err.message
      );
      return { ok: false, error: err.message };
    }
  }

  async findById(productId: string): Promise<Product | null> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("product_id", productId)
      .single();

    if (error || !data) return null;

    return this.mapToProduct(data);
  }

  async findByProjectId(projectId: string): Promise<Product[]> {
    // Usar la tabla intermedia project_products para obtener los productos de un proyecto
    const { data, error } = await this.supabaseClient
      .from("project_products")
      .select(
        `
        product_id,
        products (*)
      `
      )
      .eq("project_id", projectId)
      .order("products(weight)", { ascending: true });

    if (error || !data) return [];

    // Mapear los productos desde la relación
    return data
      .map((row: any) => row.products)
      .filter((product: any) => product !== null)
      .map((product: any) => this.mapToProduct(product));
  }

  async findByAdminId(adminId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProduct(row));
  }

  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    // Construir objeto de actualización solo con campos permitidos
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.cover_image !== undefined)
      updateData.cover_image = updates.cover_image;
    if (updates.constants !== undefined)
      updateData.constants = updates.constants;
    if (updates.path !== undefined) updateData.path = updates.path;
    if (updates.weight !== undefined) updateData.weight = updates.weight;

    const { data, error } = await this.supabaseClient
      .from("products")
      .update(updateData)
      .eq("product_id", productId)
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }

    return { product: this.mapToProduct(data), ok: true, error: null };
  }

  async deleteProduct(
    productId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      // 1. Verificar que el producto existe
      const product = await this.findById(productId);
      if (!product) {
        return { ok: false, error: "Producto no encontrado" };
      }

      // 2. Eliminar carpeta completa del Storage usando StorageRepository
      const folderPath = `${product.admin_id}/${productId}`;
      const { ok: deleteFolderOk, error: deleteFolderError } =
        await this.storageRepository.deleteFolder(folderPath);

      if (!deleteFolderOk && deleteFolderError) {
        console.warn(
          "Error eliminando carpeta del Storage:",
          deleteFolderError
        );
      }

      // 3. Eliminar el producto de la base de datos
      // El trigger automáticamente actualizará num_products en projects
      // CASCADE eliminará registros relacionados en view_products
      const { error: deleteError } = await this.supabaseClient
        .from("products")
        .delete()
        .eq("product_id", productId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando producto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async searchProducts(
    projectId: string,
    searchTerm: string
  ): Promise<Product[]> {
    // Primero obtener los IDs de productos del proyecto
    const { data: projectProductsData, error: projectProductsError } =
      await this.supabaseClient
        .from("project_products")
        .select("product_id")
        .eq("project_id", projectId);

    if (projectProductsError || !projectProductsData) return [];

    const productIds = projectProductsData.map((pp) => pp.product_id);

    if (productIds.length === 0) return [];

    // Luego buscar en esos productos
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .in("product_id", productIds)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("weight", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProduct(row));
  }

  // Nuevos métodos para manejar la relación muchos-a-muchos
  async addProductToProject(
    productId: string,
    projectId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      const { error } = await this.supabaseClient
        .from("project_products")
        .insert({
          project_id: projectId,
          product_id: productId,
        });

      if (error) {
        // Si ya existe la relación, no es un error crítico
        if (error.code === "23505") {
          // Duplicate key
          return { ok: true, error: null };
        }
        throw new Error(error.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error añadiendo producto al proyecto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async removeProductFromProject(
    productId: string,
    projectId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      // 1. Primero, obtener todas las vistas del proyecto
      const { data: views, error: viewsError } = await this.supabaseClient
        .from("views")
        .select("view_id")
        .eq("project_id", projectId);

      if (viewsError) {
        console.error("Error obteniendo vistas:", viewsError.message);
      }

      // 2. Eliminar el producto de todas las vistas (view_products)
      if (views && views.length > 0) {
        const viewIds = views.map((v) => v.view_id);
        const { error: viewProductsError } = await this.supabaseClient
          .from("view_products")
          .delete()
          .in("view_id", viewIds)
          .eq("product_id", productId);

        if (viewProductsError) {
          console.error(
            "Error eliminando producto de vistas:",
            viewProductsError.message
          );
        }
      }

      // 3. Finalmente, eliminar la relación project_products
      const { error } = await this.supabaseClient
        .from("project_products")
        .delete()
        .eq("project_id", projectId)
        .eq("product_id", productId);

      if (error) {
        throw new Error(error.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando producto del proyecto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async findProjectsByProductId(productId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from("project_products")
      .select("project_id")
      .eq("product_id", productId);

    if (error || !data) return [];

    return data.map((row) => row.project_id);
  }

  // Método helper para mapear datos de DB a la entidad Product
  private mapToProduct(data: any): Product {
    return {
      id: data.product_id, // Mapear también a 'id' para compatibilidad
      product_id: data.product_id,
      admin_id: data.admin_id,
      name: data.name,
      description: data.description,
      cover_image: data.cover_image,
      constants: data.constants,
      path: data.path,
      weight: parseFloat(data.weight),
      num_images: data.num_images,
      size: data.size,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
