/**
 * Entidad para la tabla intermedia project_products
 * Representa la relación muchos-a-muchos entre projects y products
 */
export interface ProjectProduct {
  project_id: string; // Referencia a projects (parte de la clave primaria)
  product_id: string; // Referencia a products (parte de la clave primaria)
}
