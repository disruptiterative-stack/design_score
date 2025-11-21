import { useState } from "react";

/**
 * Hook genérico para manejar pestañas/tabs
 */
export function useTabs<T extends string>(initialTab: T) {
  const [activeTab, setActiveTab] = useState<T>(initialTab);

  const switchTo = (tab: T) => {
    setActiveTab(tab);
  };

  const isActive = (tab: T) => activeTab === tab;

  return {
    activeTab,
    setActiveTab,
    switchTo,
    isActive,
  };
}
