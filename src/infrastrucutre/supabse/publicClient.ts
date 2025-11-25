import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase anónimo para acceso público a proyectos compartidos
 * No requiere autenticación
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
