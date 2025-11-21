import { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "play" | "edit" | "delete";
  tooltip?: string;
}

export default function IconButton({
  icon,
  variant = "edit",
  tooltip,
  className = "",
  ...props
}: IconButtonProps) {
  const variantStyles = {
    play: "bg-blue-600 hover:bg-blue-700",
    edit: "bg-yellow-600 hover:bg-yellow-700",
    delete: "bg-red-600 hover:bg-red-700",
  };

  return (
    <button
      className={`flex items-center justify-center p-3 text-white rounded transition-colors ${variantStyles[variant]} ${className}`}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  );
}
