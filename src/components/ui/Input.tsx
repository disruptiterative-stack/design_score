import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
  containerClassName?: string;
}

export default function Input({
  label,
  error,
  labelClassName = "",
  containerClassName = "",
  className = "",
  ...props
}: InputProps) {
  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {label && (
        <label
          className={`text-neutral-950 text-sm mb-2 text-center ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full p-3 bg-white border border-neutral-400 text-gray-800 text-center focus:outline-none focus:border-neutral-950 transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1 text-center">{error}</p>
      )}
    </div>
  );
}
