import { useState, useEffect } from "react";
import Button from "@/src/components/ui/Button";
// import SingleFileUploadModal from "@/src/components/SingleFileUploadModal"; // COMENTADO: archivo eliminado durante refactorización
// useRef y DragEvent comentados - eran para funcionalidad drag & drop deshabilitada

/* interface FileUploadSectionProps {t { useState, useRef, DragEvent, useEffect } from "react";
import Button from "@/src/components/ui/Button";
// import SingleFileUploadModal from "@/src/components/SingleFileUploadModal"; // COMENTADO: archivo eliminado durante refactorización

/* interface FileUploadSectionProps {
  initialFiles: File[];
  onFilesUploaded: (files: File[]) => void;
  onBack: () => void;
} */
/* 
export default function FileUploadSection({
  initialFiles,
  onFilesUploaded,
  onBack,
}: FileUploadSectionProps) { */

interface FileUploadSectionProps {
  /*   numProducts: number; */
  initialFiles?: File[];
  onFilesUploaded: (files: File[]) => void;
  onBack: () => void;
  // adminId y projectId comentados - eran para SingleFileUploadModal que fue eliminado
  // adminId?: string;
  // projectId?: string;
}

export default function FileUploadSection({
  /* numProducts, */
  initialFiles = [],
  onFilesUploaded,
  onBack,
}: // adminId y projectId comentados - eran para SingleFileUploadModal que fue eliminado
// adminId = "",
// projectId = "",
FileUploadSectionProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  // isDragging, fileInputRef y handlers de drag comentados - eran para área drag & drop que está deshabilitada
  // const [isDragging, setIsDragging] = useState(false);
  // const [isModalOpen, setIsModalOpen] = useState(false); // COMENTADO: era para SingleFileUploadModal
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar archivos cuando cambien los datos iniciales
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  /* HANDLERS DE DRAG & DROP COMENTADOS - área drag & drop deshabilitada
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };
  */

  /* FUNCIÓN COMENTADA - era para SingleFileUploadModal que fue eliminado
  const _handleSingleFileUpload = async (file: File, modelName: string) => {
    // Aquí puedes procesar el archivo individual si es necesario
    console.log("Subiendo archivo:", file.name, "con nombre:", modelName);
    // Por ahora solo lo agregamos a la lista
    setFiles((prev) => [...prev, file]);
  };
  */

  /* FUNCIÓN COMENTADA - era para agregar archivos cuando se usaba drag & drop
  const _addFiles = (newFiles: File[]) => {
    // Validar que solo sean archivos ZIP o RAR
    const validFiles = newFiles.filter((file) => {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".zip") && !fileName.endsWith(".rar")) {
        alert(
          `El archivo "${file.name}" no es válido. Solo se aceptan archivos .zip o .rar`
        );
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };
  */

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (files.length > 0) {
      onFilesUploaded(files);
    }
  };

  const handleBack = () => {
    // Guardar los archivos actuales antes de retroceder
    onFilesUploaded(files);
    onBack();
  };

  /* FUNCIÓN COMENTADA - era para SingleFileUploadModal que fue eliminado
  const _handleSingleFileUpload2 = async (file: File, modelName: string) => {
    // Aquí puedes procesar el archivo individual si es necesario
    console.log("Subiendo archivo:", file.name, "con nombre:", modelName);
    // Por ahora solo lo agregamos a la lista
    setFiles((prev) => [...prev, file]);
  };
  */

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-gray-800 mb-2">
          Subir Archivos
        </h2>
        <p className="text-gray-600 text-sm">
          Sube los archivos ZIP con las imágenes de tus productos 3D
        </p>
      </div>

      {/* Botón para subir un solo archivo - COMENTADO: SingleFileUploadModal eliminado durante refactorización */}
      {/*
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
        >
          <PlusIcon />
          <span>Agregar Modelo Individual</span>
        </button>
      </div>
      */}

      {/* Drag and Drop Area */}
      {/* <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-gray-800 bg-gray-100"
            : "border-gray-300 bg-gray-50"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <UploadIcon />
          <div>
            <p className="text-gray-800 font-medium mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-gray-500 text-sm">
              Archivos ZIP o RAR con modelos 3D
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".zip,.rar"
        />
      </div> */}
      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Archivos seleccionados ({files.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileIcon />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={handleBack}>
          ← Anterior
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={files.length === 0}
        >
          Siguiente →
        </Button>
      </div>

      {/* Modal para subir archivo individual - COMENTADO: SingleFileUploadModal eliminado durante refactorización */}
      {/* 
      <SingleFileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleSingleFileUpload}
        adminId={adminId}
        projectId={projectId}
      />
      */}
    </div>
  );
}

// Iconos SVG
// PlusIcon y UploadIcon comentados - eran para funcionalidad de SingleFileUploadModal que fue eliminado
/* 
function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-12 h-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}
*/

function FileIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-600"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
