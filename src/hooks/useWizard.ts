import { useState } from "react";

export type WizardStep = "info" | "upload" | "views";

/**
 * Hook para manejar la navegación entre pasos de un wizard
 */
export function useWizard(initialStep: WizardStep = "info") {
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const goToInfo = () => setCurrentStep("info");
  const goToUpload = () => setCurrentStep("upload");
  const goToViews = () => setCurrentStep("views");

  const isOnInfo = currentStep === "info";
  const isOnUpload = currentStep === "upload";
  const isOnViews = currentStep === "views";

  const hasCompletedInfo = currentStep === "upload" || currentStep === "views";
  const hasCompletedUpload = currentStep === "views";

  return {
    currentStep,
    goToStep,
    goToInfo,
    goToUpload,
    goToViews,
    isOnInfo,
    isOnUpload,
    isOnViews,
    hasCompletedInfo,
    hasCompletedUpload,
  };
}
