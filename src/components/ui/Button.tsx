import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "px-8 py-2 transition-colors font-medium";

  const variantStyles = {
    primary:
      "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "border border-gray-400 bg-neutral-800 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "text-gray-900 border text-sm hover:text-gray-400 transition-colors disabled:opacity-50",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Procesando..." : children}
    </button>
  );
}
