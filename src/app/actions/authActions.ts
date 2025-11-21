"use server";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { isValidEmail, sanitizeString } from "@/src/lib/securityUtils";

export async function signInAction(email: string, password: string) {
  try {
    // Validaciones de seguridad
    if (!email || !password) {
      return { success: false, error: "Email y contraseña son requeridos" };
    }

    const sanitizedEmail = sanitizeString(email.toLowerCase().trim());

    if (!isValidEmail(sanitizedEmail)) {
      return { success: false, error: "Email inválido" };
    }

    if (password.length < 6) {
      return { success: false, error: "Contraseña inválida" };
    }

    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const { user, session } = await authUseCase.signIn(
      sanitizedEmail,
      password
    );
    return { success: true, user };
  } catch (error) {
    // No exponer detalles internos del error
    console.error("Error en signIn:", error);
    return {
      success: false,
      error: "Credenciales inválidas o error de autenticación",
    };
  }
}

export async function signUpAction(email: string, password: string) {
  try {
    // Validaciones de seguridad
    if (!email || !password) {
      return { success: false, error: "Email y contraseña son requeridos" };
    }

    const sanitizedEmail = sanitizeString(email.toLowerCase().trim());

    if (!isValidEmail(sanitizedEmail)) {
      return { success: false, error: "Formato de email inválido" };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 8 caracteres",
      };
    }

    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const { user, session } = await authUseCase.signUp(
      sanitizedEmail,
      password
    );
    return { success: true, user };
  } catch (error) {
    // No exponer detalles internos del error
    console.error("Error en signUp:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al crear cuenta";

    // Sanitizar mensaje de error para no exponer información sensible
    const safeMessage = errorMessage.includes("already registered")
      ? "Este email ya está registrado"
      : "Error al crear la cuenta. Intenta nuevamente.";

    return { success: false, error: safeMessage };
  }
}

export async function signOutAction() {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    await authUseCase.signOut();
    return { success: true };
  } catch (error) {
    console.error("Error en signOut:", error);
    return { success: false, error: "Error al cerrar sesión" };
  }
}

export async function getCurrentUserAction() {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const user = await authUseCase.getCurrentUser();
    return { success: true, user };
  } catch (error) {
    // No exponer detalles del error
    console.error("Error obteniendo usuario actual:", error);
    return { success: false, error: "Error de autenticación", user: null };
  }
}
