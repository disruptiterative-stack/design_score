/**
 * Sistema de logging seguro que solo registra en desarrollo
 * En producción, los logs se silencian para evitar exponer información sensible
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Log de información general (solo en desarrollo)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log("[INFO]", ...args);
    }
  },

  /**
   * Log de advertencias (solo en desarrollo)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn("[WARN]", ...args);
    }
  },

  /**
   * Log de errores (solo en desarrollo)
   */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error("[ERROR]", ...args);
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug("[DEBUG]", ...args);
    }
  },
};
