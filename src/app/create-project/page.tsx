"use client";

import { useRouter } from "next/navigation";
import Button from "@/src/components/ui/Button";
import ProductSelectionSection from "@/src/components/create-project/ProductSelectionSection";
import ProjectInfoForm from "@/src/components/create-project/ProjectInfoForm";
import ViewsConfigSection from "@/src/components/create-project/ViewsConfigSection";
import LoadingModal from "@/src/components/LoadingModal";
import { useWizard } from "@/src/hooks/useWizard";
import { useProjectCreation } from "@/src/hooks/useProjectCreation";

export default function CreateProjectPage() {
  const router = useRouter();
  const wizard = useWizard();
  const projectCreation = useProjectCreation();

  const handleProjectInfoSubmit = (data: {
    name: string;
    finalMessage: string;
  }) => {
    projectCreation.setProjectData(data);
    wizard.goToUpload();
  };

  const handleProductsSelected = (productIds: string[]) => {
    projectCreation.handleProductsSelected(productIds);
    wizard.goToViews();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            Crear Nuevo Proyecto
          </h1>
          <p className="text-gray-600">
            Completa los pasos para crear tu proyecto
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <StepIndicator
            step={1}
            label="Información"
            isActive={wizard.isOnInfo}
            isCompleted={wizard.hasCompletedInfo}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            step={2}
            label="Productos"
            isActive={wizard.isOnUpload}
            isCompleted={wizard.hasCompletedUpload}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            step={3}
            label="Vistas"
            isActive={wizard.isOnViews}
            isCompleted={false}
          />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-md">
          {wizard.isOnInfo && (
            <ProjectInfoForm
              onSubmit={handleProjectInfoSubmit}
              initialData={projectCreation.projectData}
            />
          )}

          {wizard.isOnUpload && (
            <ProductSelectionSection
              initialSelectedProducts={projectCreation.selectedProductIds}
              onProductsSelected={handleProductsSelected}
              onBack={() => wizard.goToInfo()}
            />
          )}

          {wizard.isOnViews && (
            <ViewsConfigSection
              numProducts={projectCreation.selectedProductIds.length}
              views={projectCreation.views}
              onViewsChange={projectCreation.setViews}
              onBack={() => wizard.goToUpload()}
              onSubmit={projectCreation.createProject}
              isSubmitting={projectCreation.isSubmitting}
            />
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="hover:underline"
          >
            ← Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={projectCreation.isSubmitting}
        progress={projectCreation.loadingProgress}
        message={projectCreation.loadingMessage}
      />
    </div>
  );
}

// Componente indicador de paso
function StepIndicator({
  step,
  label,
  isActive,
  isCompleted,
}: {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
          isCompleted
            ? "bg-gray-800 text-white"
            : isActive
            ? "bg-gray-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? "✓" : step}
      </div>
      <span
        className={`text-sm ${
          isActive || isCompleted ? "text-gray-800" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
