import { Product } from "../entities/Product";
import { IProductRepository } from "../ports/IProductRepository";

export class ProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Crea un nuevo producto
   */
  async createProduct(product: Product) {
    if (!product.name || product.name.trim().length === 0) {
      throw new Error("El nombre del producto es requerido");
    }
    if (!product.admin_id) {
      throw new Error("El ID del administrador es requerido");
    }
    // Ya no se requiere project_id en la creación del producto
    // La relación se establece después mediante addProductToProject
    return await this.productRepository.createProduct(product);
  }

  /**
   * Agrega una imagen a un producto existente
   */
  async addImageToProduct(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage: boolean = false
  ) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    if (!adminId) {
      throw new Error("El ID del administrador es requerido");
    }
    return await this.productRepository.addImageToProduct(
      productId,
      adminId,
      image,
      isFirstImage
    );
  }

  /**
   * Obtiene un producto por su ID
   */
  async getProductById(productId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    return await this.productRepository.findById(productId);
  }

  /**
   * Obtiene todos los productos de un proyecto
   */
  async getProductsByProjectId(projectId: string) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }
    return await this.productRepository.findByProjectId(projectId);
  }

  /**
   * Obtiene todos los productos de un administrador
   */
  async getProductsByAdminId(adminId: string) {
    if (!adminId) {
      throw new Error("El ID del administrador es requerido");
    }
    return await this.productRepository.findByAdminId(adminId);
  }

  /**
   * Actualiza la información de un producto
   */
  async updateProduct(productId: string, updates: Partial<Product>) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("El nombre del producto no puede estar vacío");
    }
    if (updates.weight !== undefined && updates.weight < 0) {
      throw new Error("El peso del producto no puede ser negativo");
    }
    return await this.productRepository.updateProduct(productId, updates);
  }

  /**
   * Elimina un producto y todas sus imágenes asociadas
   * El trigger en la BD actualizará automáticamente num_products en projects
   * CASCADE eliminará registros relacionados en view_products
   */
  async deleteProduct(productId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    return await this.productRepository.deleteProduct(productId);
  }

  /**
   * Busca productos por término de búsqueda dentro de un proyecto
   */
  async searchProducts(projectId: string, searchTerm: string) {
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await this.getProductsByProjectId(projectId);
    }
    return await this.productRepository.searchProducts(projectId, searchTerm);
  }

  /**
   * Añade un producto a un proyecto (relación muchos-a-muchos)
   */
  async addProductToProject(productId: string, projectId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }
    return await this.productRepository.addProductToProject(
      productId,
      projectId
    );
  }

  /**
   * Elimina un producto de un proyecto (relación muchos-a-muchos)
   */
  async removeProductFromProject(productId: string, projectId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    if (!projectId) {
      throw new Error("El ID del proyecto es requerido");
    }
    return await this.productRepository.removeProductFromProject(
      productId,
      projectId
    );
  }

  /**
   * Obtiene todos los proyectos a los que pertenece un producto
   */
  async findProjectsByProductId(productId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    return await this.productRepository.findProjectsByProductId(productId);
  }
}
