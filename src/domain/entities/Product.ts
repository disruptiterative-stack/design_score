export interface Product {
  // Identificador utilizado en algunas consultas/listados (puede venir como "id" o "product_id")
  id?: string;
  product_id?: string;
  admin_id: string; // ID del administrador que creó el producto (referencia a auth.users)
  user_id?: string; // ID del usuario propietario (opcional, para CDN)
  // NOTA: project_id eliminado - ahora la relación es muchos-a-muchos via project_products
  name: string;
  description?: string;
  cover_image?: string;
  // Puede ser un objeto (JSONB) o una cadena serializada dependiendo de cómo se consulte
  constants?: Record<string, unknown> | string; // JSONB o string
  path?: string; // URL del producto
  weight: number; // Peso del producto, default 0
  // Metadatos adicionales retornados por consultas (opcional)
  num_images?: number;
  size?: number; // tamaño en bytes
  created_at?: string;
  updated_at?: string;
}
