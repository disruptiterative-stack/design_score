/**
 * Wrapper seguro para Server Actions
 * Proporciona manejo consistente de errores y validaciones
 */

import { createClient } from "@/src/infrastrucutre/supabse/client";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Envuelve una Server Action con autenticación automática
 */
export async function withAuth<T>(
  action: (userId: string) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "No autenticado. Por favor, inicia sesión.",
      };
    }

    const result = await action(user.id);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error en acción autenticada:", error);
    return {
      success: false,
      error: "Error al procesar la solicitud",
    };
  }
}

/**
 * Envuelve una Server Action con manejo de errores
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  errorMessage: string = "Error al procesar la solicitud"
): Promise<ActionResult<T>> {
  try {
    const result = await action();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error en acción:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Valida que el usuario sea dueño del recurso
 */
export async function validateOwnership(
  resourceUserId: string,
  currentUserId: string
): Promise<boolean> {
  return resourceUserId === currentUserId;
}

/**
 * Wrapper para acciones que requieren ownership
 */
export async function withOwnership<T>(
  resourceUserId: string,
  action: (userId: string) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "No autenticado",
      };
    }

    const isOwner = await validateOwnership(resourceUserId, user.id);

    if (!isOwner) {
      console.warn(
        `⚠️ Intento de acceso no autorizado: usuario ${user.id} intentó acceder a recurso de ${resourceUserId}`
      );
      return {
        success: false,
        error: "No tienes permiso para realizar esta acción",
      };
    }

    const result = await action(user.id);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error en acción con ownership:", error);
    return {
      success: false,
      error: "Error al procesar la solicitud",
    };
  }
}

/**
 * Rate limiting simple para acciones
 */
const actionRateLimits = new Map<string, number[]>();

export function checkActionRateLimit(
  userId: string,
  actionName: string,
  maxCalls: number = 10,
  windowMs: number = 60000
): boolean {
  const key = `${userId}:${actionName}`;
  const now = Date.now();
  const timestamps = actionRateLimits.get(key) || [];

  // Filtrar timestamps dentro de la ventana
  const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (recentTimestamps.length >= maxCalls) {
    console.warn(
      `⚠️ Rate limit excedido para ${actionName} por usuario ${userId}`
    );
    return false;
  }

  // Agregar timestamp actual
  recentTimestamps.push(now);
  actionRateLimits.set(key, recentTimestamps);

  return true;
}

/**
 * Wrapper con rate limiting
 */
export async function withRateLimit<T>(
  actionName: string,
  maxCalls: number,
  windowMs: number,
  action: (userId: string) => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "No autenticado",
      };
    }

    const allowed = checkActionRateLimit(
      user.id,
      actionName,
      maxCalls,
      windowMs
    );

    if (!allowed) {
      return {
        success: false,
        error: "Demasiadas solicitudes. Por favor, espera un momento.",
      };
    }

    const result = await action(user.id);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error en acción con rate limit:", error);
    return {
      success: false,
      error: "Error al procesar la solicitud",
    };
  }
}

/**
 * Limpia rate limits antiguos (ejecutar periódicamente)
 */
export function cleanupActionRateLimits(): void {
  const now = Date.now();
  actionRateLimits.forEach((timestamps, key) => {
    const recent = timestamps.filter((ts) => now - ts < 3600000); // 1 hora
    if (recent.length === 0) {
      actionRateLimits.delete(key);
    } else {
      actionRateLimits.set(key, recent);
    }
  });
}

// Cleanup automático cada 10 minutos
if (typeof setInterval !== "undefined") {
  setInterval(cleanupActionRateLimits, 600000);
}
