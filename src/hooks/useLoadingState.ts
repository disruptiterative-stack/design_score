import { useState } from "react";

/**
 * Hook para manejar el estado de carga con progreso y mensajes
 */
export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const startLoading = (initialMessage: string = "Cargando...") => {
    setIsLoading(true);
    setProgress(0);
    setMessage(initialMessage);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(newProgress);
    if (newMessage) {
      setMessage(newMessage);
    }
  };

  const finishLoading = (finalMessage?: string) => {
    setProgress(100);
    if (finalMessage) {
      setMessage(finalMessage);
    }
  };

  const resetLoading = () => {
    setIsLoading(false);
    setProgress(0);
    setMessage("");
  };

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    finishLoading,
    resetLoading,
    setIsLoading,
    setProgress,
    setMessage,
  };
}
