import React from "react";
import { LucideIcon } from "lucide-react";
import Spinner from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "rounded-md inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl",
    secondary:
      "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl",
    outline:
      "border-2 border-gray-300 dark:border-gray-600 flex itmes-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm hover:shadow-md",
    ghost: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
  };

  // Dynamic sizing based on whether button has children (text) or is icon-only
  const getSizeClasses = () => {
    const baseSize = {
      sm: "text-xs sm:text-sm",
      md: "text-xs sm:text-sm", 
      lg: "text-sm sm:text-base"
    };
    
    if (children) {
      // Has text - use normal padding
      const paddingSize = {
        sm: "px-2.5 sm:px-3 py-1.5 sm:py-2",
        md: "px-3 sm:px-4 py-2 sm:py-2.5",
        lg: "px-4 sm:px-6 py-2.5 sm:py-3"
      };
      return `${paddingSize[size]} ${baseSize[size]}`;
    } else {
      // Icon-only - minimal padding for mobile, normal for desktop
      const iconPaddingSize = {
        sm: "px-1 sm:px-3 py-1 sm:py-2",
        md: "px-1.5 sm:px-4 py-1.5 sm:py-2.5", 
        lg: "px-2 sm:px-6 py-2 sm:py-3"
      };
      return `${iconPaddingSize[size]} ${baseSize[size]}`;
    }
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${getSizeClasses()} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Spinner size="sm" color="white" />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : Icon && iconPosition === "left" ? (
        <>
          <Icon className="w-4 h-4" />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : (
        <>
          {children}
          {Icon && iconPosition === "right" && (
            <Icon className="w-4 h-4 ml-2" />
          )}
        </>
      )}
    </button>
  );
};

export default Button;
