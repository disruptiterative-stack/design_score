import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador
 * Este cliente se usa en componentes del cliente y hooks
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
