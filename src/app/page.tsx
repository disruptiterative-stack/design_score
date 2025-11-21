"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import AuthForm from "../components/AuthForm";
import { createBrowserClient } from "@supabase/ssr";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);

  // Obtener mensaje de sesión expirada directamente del searchParams
  const sessionStatus = searchParams.get("session");
  const sessionExpiredMessage =
    sessionStatus === "expired"
      ? "Tu sesión ha expirado después de 4 horas de inactividad. Por favor, inicia sesión nuevamente."
      : "";

  // Verificar si ya hay una sesión activa (usando getUser de forma segura)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          // Si hay sesión activa, redirigir al dashboard
          router.push("/dashboard");
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router]);

  // ...existing code...

  const handleAuthSuccess = () => {
    // Redirigir directamente a /dashboard
    router.push("/dashboard");
  };

  // Mostrar un loader mientras verifica la sesión
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800 mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-gray-800 mb-2">Design Score</h1>
      </div>

      {/* Mensaje de sesión expirada */}
      {sessionExpiredMessage && (
        <div className="mb-6 w-full max-w-md bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{sessionExpiredMessage}</p>
            </div>
          </div>
        </div>
      )}

      <AuthForm onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800 mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
