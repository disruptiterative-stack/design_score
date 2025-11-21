import type { NextConfig } from "next";

// Obtener hostnames desde variables de entorno
const supabaseHostnames = [process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME].filter(
  Boolean
) as string[];

const nextConfig: NextConfig = {
  // Optimización de imágenes
  images: {
    remotePatterns: supabaseHostnames.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/storage/v1/object/public/**",
    })),
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compresión de assets
  compress: true,

  // React optimizations
  reactStrictMode: true,

  // Poweredby header removal (seguridad)
  poweredByHeader: false,

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        // Assets estáticos de KeyShot - caché agresivo
        source: "/keyshotAssets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JavaScript estático - caché agresivo
        source: "/js/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Headers de seguridad para todas las rutas
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; " +
              "style-src 'self' 'unsafe-inline'; " +
              `img-src 'self' data: blob: ${supabaseHostnames
                .map((h) => `https://${h}`)
                .join(" ")}; ` +
              "font-src 'self' data:; " +
              `connect-src 'self' ${supabaseHostnames
                .map((h) => `https://${h} wss://${h}`)
                .join(" ")}; ` +
              "frame-src 'self'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'self'; " +
              "upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },

  // Experimental features para mejor performance
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "@supabase/ssr"],
    serverActions: {
      bodySizeLimit: "100mb", // O el tamaño que necesites
    },
    middlewareClientMaxBodySize: 100 * 1024 * 1024, // 100MB
  },
};

export default nextConfig;
