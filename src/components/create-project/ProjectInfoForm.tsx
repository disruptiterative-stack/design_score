"use client";

import { useState, FormEvent, useEffect } from "react";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";

interface ProjectInfoFormProps {
  onSubmit: (data: { name: string; finalMessage: string }) => void;
  initialData?: { name: string; finalMessage: string };
}

export default function ProjectInfoForm({
  onSubmit,
  initialData,
}: ProjectInfoFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [finalMessage, setFinalMessage] = useState(
    initialData?.finalMessage || ""
  );

  // Actualizar el estado cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setFinalMessage(initialData.finalMessage);
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), finalMessage: finalMessage.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-light text-gray-800 mb-6">
        Información del Proyecto
      </h2>

      <Input
        type="text"
        label="Nombre del Proyecto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Mi Proyecto 3D"
        required
        containerClassName="mb-4"
      />

      <div className="flex flex-col">
        <label className="text-gray-700 text-sm mb-2">
          Mensaje Final (Opcional)
        </label>
        <textarea
          value={finalMessage}
          onChange={(e) => setFinalMessage(e.target.value)}
          placeholder="Mensaje que se mostrará al finalizar la presentación..."
          rows={4}
          className="w-full p-3 bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors resize-none"
        />
        <p className="text-gray-500 text-xs mt-1">
          Este mensaje se mostrará después de que el usuario complete todas las
          vistas
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary">
          Siguiente →
        </Button>
      </div>
    </form>
  );
}
