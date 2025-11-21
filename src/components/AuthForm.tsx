"use client";

import { useState, FormEvent, useEffect } from "react";
import {
  signInAction,
  signUpAction,
  signOutAction,
} from "../app/actions/authActions";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface AuthFormProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpiar formulario cuando se monta el componente
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setMode("signin");
  }, []);

  /*  const handleClearSession = async () => {
    try {
      await signOutAction();
      setError(null);
      setEmail("");
      setPassword("");
      alert("✅ Sesión limpiada. Intenta iniciar sesión nuevamente.");
    } catch (err: any) {
      console.error("Error limpiando sesión:", err);
    }
  }; */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (mode === "signin") {
        result = await signInAction(email, password);
      } else {
        result = await signUpAction(email, password);
      }

      if (!result.success || !result.user) {
        setError(result.error || "Error en autenticación");
        return;
      }

      onAuthSuccess({
        id: result.user.id,
        email: result.user.email || email,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-lg shadow-2xl"
      >
        <div className="flex flex-col gap-6">
          {/* Campo de Usuario */}
          <Input
            type="email"
            label="Usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Campo de Contraseña */}
          <Input
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Mensaje de Error */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* Botón de Ingreso */}
          <div className="flex items-center justify-center gap-3">
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {mode === "signin" ? "Ingresar" : "Registrarse"}
            </Button>
          </div>
        </div>
      </form>

      {/* Botón secundario para alternar modo */}
      <div className="mt-4 text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="hover:underline"
        >
          {mode === "signin"
            ? "¿No tienes cuenta? Crear una nueva"
            : "¿Ya tienes cuenta? Iniciar sesión"}
        </Button>
      </div>
    </div>
  );
}
