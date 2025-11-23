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
    // Solo loguear en desarrollo, no en producción
    if (process.env.NODE_ENV === "development") {
      console.error("Error en signIn:", error);
    }

    // Mensajes de error explícitos según el tipo de error
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    if (errorMessage === "INVALID_CREDENTIALS") {
      return {
        success: false,
        error: "usuario o contraseña incorrecta.",
      };
    }

    if (errorMessage === "AUTHENTICATION_FAILED") {
      return {
        success: false,
        error: "Error de autenticación. Por favor, intenta nuevamente.",
      };
    }

    // Error genérico para casos no específicos
    return {
      success: false,
      error:
        "Error al iniciar sesión. Verifica tus credenciales e intenta nuevamente.",
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
    // Solo loguear en desarrollo, no en producción
    if (process.env.NODE_ENV === "development") {
      console.error("Error en signUp:", error);
    }

    // Mensajes de error explícitos
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    if (errorMessage === "USER_ALREADY_EXISTS") {
      return {
        success: false,
        error:
          "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
      };
    }

    if (errorMessage === "REGISTRATION_FAILED") {
      return {
        success: false,
        error: "Error al crear la cuenta. Por favor, intenta nuevamente.",
      };
    }

    // Error genérico para casos no específicos
    return {
      success: false,
      error:
        "Error al crear la cuenta. Por favor, verifica los datos e intenta nuevamente.",
    };
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
    // Solo loguear en desarrollo, no en producción
    if (process.env.NODE_ENV === "development") {
      console.error("Error en signOut:", error);
    }
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
    // Solo loguear en desarrollo, no en producción
    if (process.env.NODE_ENV === "development") {
      console.error("Error obteniendo usuario actual:", error);
    }
    return { success: false, error: "Error de autenticación", user: null };
  }
}
