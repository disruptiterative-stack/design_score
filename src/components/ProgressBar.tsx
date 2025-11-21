"use client";

interface ProgressBarProps {
  percentage: number;
}

export default function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div
        className="bg-black h-4 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` } as React.CSSProperties}
      />
    </div>
  );
}
