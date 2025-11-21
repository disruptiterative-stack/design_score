import { Product } from "./Product";

export interface Project {
  project_id?: string; // UUID con valor por defecto
  admin_id: string; // Referencia a usuario Supabase (auth.users)
  name: string;
  num_products?: number; // Número de productos, default 0
  final_message?: string;
  created_at?: string;
  updated_at?: string;
  size?: number;
  num_product?: number;
  // Campos opcionales para relaciones pobladas
  products?: Product[];
}
