import { Loader } from "lucide-react";
import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: "blue" | "white" | "gray";
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
  color = "blue",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorClasses = {
    blue: "text-[var(--color-primary)] dark:text-[#a9b0ff]",
    white: "text-white dark:text-gray-200",
    gray: "text-gray-600 dark:text-gray-400",
  };

  return (
    <Loader
      className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin ${className}`}
    />
  );
};

export default Spinner;
