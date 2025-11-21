import { Product } from "../entities/Product";

export interface IProductRepository {
  createProduct(
    product: Product
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;

  addImageToProduct(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage?: boolean
  ): Promise<{
    ok: boolean;
    error: string | null;
  }>;

  findById(productId: string): Promise<Product | null>;

  findByProjectId(projectId: string): Promise<Product[]>;

  findByAdminId(adminId: string): Promise<Product[]>;

  updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;

  deleteProduct(
    productId: string
  ): Promise<{ ok: boolean; error: string | null }>;

  searchProducts(projectId: string, searchTerm: string): Promise<Product[]>;

  // Métodos para manejar la relación muchos-a-muchos con projects
  addProductToProject(
    productId: string,
    projectId: string
  ): Promise<{ ok: boolean; error: string | null }>;

  removeProductFromProject(
    productId: string,
    projectId: string
  ): Promise<{ ok: boolean; error: string | null }>;

  findProjectsByProductId(productId: string): Promise<string[]>;
}
