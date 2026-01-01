const Button = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  loading = false, // Added loading prop
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
    neutral:
      "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400",
  };

  return (
    <button
      type={type} // ← critical: ensures button type works
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${sizeClasses[size]} ${variantClasses[variant]} ${disabled || loading ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled || loading}
      {...props} // Pass down all other native button props
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="m 4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 z"
          ></path>
        </svg>
      )}
      {!loading && startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {!loading && endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
