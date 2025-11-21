"use client";

interface SyncToggleProps {
  isSynced: boolean;
  onToggle: (synced: boolean) => void;
}

export default function SyncToggle({ isSynced, onToggle }: SyncToggleProps) {
  const handleToggle = () => {
    onToggle(!isSynced);
  };

  return (
    <button
      onClick={handleToggle}
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg font-medium transition-all ${
        isSynced
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {isSynced ? "🔗 Sincronizado" : "🔓 Independiente"}
    </button>
  );
}
