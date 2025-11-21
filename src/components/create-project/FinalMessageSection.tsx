"use client";

import Button from "@/src/components/ui/Button";

interface FinalMessageSectionProps {
  finalMessage: string;
  onFinalMessageChange: (message: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function FinalMessageSection({
  finalMessage,
  onFinalMessageChange,
  onBack,
  onSubmit,
  isSubmitting,
}: FinalMessageSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-gray-800 mb-2">
          Mensaje Final (Opcional)
        </h2>
        <p className="text-gray-600 text-sm">
          Este mensaje se mostrará al finalizar la presentación de todas las
          vistas
        </p>
      </div>

      <div className="flex flex-col">
        <label className="text-gray-700 text-sm mb-2">Mensaje Final</label>
        <textarea
          value={finalMessage}
          onChange={(e) => onFinalMessageChange(e.target.value)}
          placeholder="Ejemplo: ¡Gracias por ver nuestra presentación! Contáctanos para más información."
          rows={6}
          className="w-full p-4 bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors resize-none rounded"
        />
        <p className="text-gray-500 text-xs mt-2">
          💡 <strong>Tip:</strong> Este campo es opcional. Si lo dejas vacío, no
          se mostrará ningún mensaje final.
        </p>
      </div>

      {/* Preview */}
      {finalMessage.trim() && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
            Vista Previa
          </p>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-800 text-lg whitespace-pre-wrap">
              {finalMessage}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Anterior
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          Crear Proyecto
        </Button>
      </div>
    </div>
  );
}
