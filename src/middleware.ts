import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard", "/upload", "/products", "/surveys"];

// Rutas públicas (accesibles sin autenticación)
const publicRoutes = ["/", "/unauthorized", "/api/upload"];

// Rutas de API que requieren autenticación
const protectedApiRoutes = [];

// Tiempo máximo de sesión: 4 horas en milisegundos
const SESSION_TIMEOUT = 4 * 60 * 60 * 1000;

/**
 * Valida el origen de la petición para prevenir CSRF
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Permitir peticiones del mismo origen
  if (!origin) return true; // Navegación directa

  // En desarrollo, permitir localhost
  if (process.env.NODE_ENV === "development") {
    return (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin === `https://${host}` ||
      origin === `http://${host}`
    );
  }

  // En producción, validar contra dominios permitidos
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  const expectedOrigin = `https://${host}`;

  return origin === expectedOrigin || allowedOrigins.includes(origin);
}

/**
 * Sanitiza parámetros de query para prevenir inyecciones
 */
function sanitizeSearchParams(request: NextRequest): void {
  const { searchParams } = request.nextUrl;
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /\.\.\//, // Path traversal
  ];

  searchParams.forEach((value) => {
    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(value)) {
        console.warn("⚠️ Patrón peligroso detectado en query params:", value);
      }
    });
  });
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sanitizar parámetros de query
  sanitizeSearchParams(request);

  // Validar origen para peticiones POST/PUT/DELETE (CSRF protection)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!isValidOrigin(request)) {
      console.warn("⚠️ Origen inválido detectado:", {
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
        pathname,
      });
      return new NextResponse("Forbidden - Invalid Origin", { status: 403 });
    }
  }

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Proteger rutas API específicas
  if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
    try {
      // Crear respuesta para poder modificar cookies
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn(
          "⚠️ Usuario no autenticado intentando acceder a:",
          pathname
        );

        // Redirigir directamente al login con parámetro de retorno
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Agregar user ID a headers para usar en la API
      response.headers.set("x-user-id", user.id);
      return response;
    } catch (error) {
      console.error("❌ Error verificando autenticación en API:", error);
      return new NextResponse(
        JSON.stringify({ error: "Error de autenticación" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Si es una ruta protegida, verificar autenticación
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    try {
      // Crear respuesta para poder modificar cookies
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn(
          "⚠️ Usuario no autenticado intentando acceder a:",
          pathname
        );

        // Redirigir a página 404 de acceso no autorizado
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // Verificar expiración de sesión (4 horas) de forma segura
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        console.error("Error obteniendo usuario autenticado:", userError);
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (userData.user) {
        // Tomamos la última hora de inicio de sesión real
        const sessionStart = new Date(
          +(userData.user.last_sign_in_at as string)
        ).getTime();
        const now = Date.now();

        // Diferencia en milisegundos
        const sessionAge = now - sessionStart;

        // Si la sesión tiene más de 4 horas, cerramos
        if (sessionAge > SESSION_TIMEOUT) {
          console.warn("⏰ Sesión expirada automáticamente");
          await supabase.auth.signOut();
          const redirectUrl = new URL("/", request.url);
          redirectUrl.searchParams.set("session", "expired");
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Usuario autenticado - agregar headers de seguridad
      response.headers.set("X-Authenticated", "true");
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );

      return response;
    } catch (error) {
      console.error("❌ Error en middleware:", error);
      // Si hay error, redirigir a página de acceso no autorizado
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Para cualquier otra ruta, permitir acceso
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (favicon)
     * - public folder (archivos públicos)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)",
  ],
};
