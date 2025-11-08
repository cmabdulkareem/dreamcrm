import { ReactNode, ButtonHTMLAttributes } from "react";

// Extend native button props so we can pass type, aria-labels, etc.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode; // Button text or content
  size?: "sm" | "md" | "lg"; // Button size
  variant?: "primary" | "outline" | "danger" | "success" | "warning" | "text"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  type = "button", // Default type is "button"
  ...props
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-transparent text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 disabled:opacity-50",
    danger:
      "bg-error-500 text-white hover:bg-error-600 disabled:bg-error-300",
    success:
      "bg-success-500 text-white hover:bg-success-600 disabled:bg-success-300",
    warning:
      "bg-warning-500 text-white hover:bg-warning-600 disabled:bg-warning-300",
    text:
      "bg-transparent text-brand-500 hover:underline disabled:text-gray-400",
  };

  return (
    <button
      type={type} // ← critical: ensures button type works
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled}
      {...props} // Pass down all other native button props
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
