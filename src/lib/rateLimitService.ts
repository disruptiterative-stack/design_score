/**
 * Rate Limiting para APIs
 * Previene abuso de endpoints limitando requests por IP/usuario
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store en memoria (para producción considera Redis)
const store: RateLimitStore = {};

export interface RateLimitConfig {
  maxRequests: number; // Máximo de requests permitidos
  windowMs: number; // Ventana de tiempo en milisegundos
}

// Configuraciones por defecto
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
};

export const UPLOAD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || "10"),
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || "3600000"), // 1 hora
};

/**
 * Verifica si una clave (IP/usuario) ha excedido el límite de rate
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = store[key];

  // Si no existe o ya pasó la ventana de tiempo, crear nuevo registro
  if (!record || now > record.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: store[key].resetTime,
    };
  }

  // Incrementar contador
  record.count++;

  // Verificar si excedió el límite
  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Limpia registros antiguos (ejecutar periódicamente)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}

// Cleanup automático cada 10 minutos
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 600000);
}

/**
 * Extrae la IP del cliente de los headers
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Genera una clave única para rate limiting
 */
export function getRateLimitKey(
  identifier: string,
  prefix: string = "api"
): string {
  return `${prefix}:${identifier}`;
}
