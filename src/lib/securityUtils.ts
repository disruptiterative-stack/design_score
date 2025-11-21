/**
 * Utilidades de seguridad para validación y sanitización
 */

/**
 * Sanitiza strings para prevenir XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/[<>]/g, "") // Remover < y >
    .replace(/javascript:/gi, "") // Remover javascript:
    .replace(/on\w+\s*=/gi, "") // Remover onclick=, onerror=, etc.
    .trim();
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Valida UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitiza nombre de archivo
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Solo caracteres seguros
    .replace(/\.{2,}/g, ".") // Prevenir path traversal
    .replace(/^\.+/, "") // No comenzar con punto
    .substring(0, 255); // Limitar longitud
}

/**
 * Valida que un string no contenga path traversal
 */
export function isPathTraversal(path: string): boolean {
  const dangerousPatterns = [/\.\./g, /\/\//g, /~\//g];
  return dangerousPatterns.some((pattern) => pattern.test(path));
}

/**
 * Valida longitud de string
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Sanitiza objeto removiendo propiedades peligrosas
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};

  allowedKeys.forEach((key) => {
    if (key in obj) {
      const value = obj[key];
      if (typeof value === "string") {
        sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
  });

  return sanitized;
}

/**
 * Valida contraseña segura
 */
export function isStrongPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un carácter especial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida que un número esté en un rango
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Escapa caracteres HTML
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char]);
}

/**
 * Valida URL segura
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Solo permitir http y https
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Limita la tasa de llamadas (simple throttle)
 */
export function createThrottle(delay: number) {
  let lastCall = 0;
  return function (fn: Function) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn();
    }
  };
}

/**
 * Valida tipo MIME de archivo
 */
export function isAllowedMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Genera un hash simple de un string (NO usar para passwords)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Valida que un objeto tenga las propiedades requeridas
 */
export function hasRequiredProperties<T extends Record<string, any>>(
  obj: T,
  requiredProps: string[]
): { isValid: boolean; missing: string[] } {
  const missing = requiredProps.filter(
    (prop) => !(prop in obj) || obj[prop] === undefined || obj[prop] === null
  );

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Limpia objetos de valores null/undefined
 */
export function removeNullish<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const cleaned: Partial<T> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      cleaned[key as keyof T] = value;
    }
  });

  return cleaned;
}
