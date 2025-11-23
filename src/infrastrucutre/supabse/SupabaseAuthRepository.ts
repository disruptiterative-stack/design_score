import { User } from "@/src/domain/entities/User";
import {
  IAuthRepository,
  IAuthResponse,
} from "@/src/domain/ports/IAuthRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private supabaseClient: SupabaseClient) {}
  async signUp(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Solo loguear en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("Error en signUp:", error?.message);
      }

      // Detectar si el usuario ya existe
      if (
        error.message.includes("already registered") ||
        error.message.includes("User already registered") ||
        error.message.includes("duplicate")
      ) {
        throw new Error("USER_ALREADY_EXISTS");
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("REGISTRATION_FAILED");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        password: password,
      },
      session: data.session,
    };
  }
  async signIn(email: string, password: string): Promise<IAuthResponse> {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Solo loguear en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("Error en signIn:", error?.code, error?.message);
      }

      // Supabase retorna estos mensajes específicos
      if (error.code == "invalid_credentials") {
        throw new Error("INVALID_CREDENTIALS");
      }
      throw new Error(error.message);
    }
    if (!data.user || !data.session) {
      throw new Error("AUTHENTICATION_FAILED");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        password: password,
      },
      session: data.session,
    };
  }
  async signOut(): Promise<void> {
    try {
      // Limpiar sesión tanto en servidor como localmente
      const { error } = await this.supabaseClient.auth.signOut({
        scope: "global",
      });
      if (error) {
        // Solo loguear en desarrollo
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ Error en signOut del servidor:", error.message);
        }
        // Aunque falle en servidor, limpiar localmente
        await this.supabaseClient.auth.signOut({ scope: "local" });
      }
    } catch (error: unknown) {
      // Si todo falla, al menos limpiar localmente
      if (process.env.NODE_ENV === "development") {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        console.error("❌ Error en signOut:", errorMessage);
      }
      await this.supabaseClient.auth
        .signOut({ scope: "local" })
        .catch(() => {});
    }
  }
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await this.supabaseClient.auth.getUser();

      if (!data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        password: "", // Do not expose the password
      };
    } catch (error: unknown) {
      // Si falla completamente, limpiar y retornar null
      if (process.env.NODE_ENV === "development") {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        console.error("❌ Error obteniendo usuario:", errorMessage);
      }
      await this.supabaseClient.auth
        .signOut({ scope: "local" })
        .catch(() => {});
      return null;
    }
  }
}
