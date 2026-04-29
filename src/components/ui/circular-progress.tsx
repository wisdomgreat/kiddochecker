
import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  size?: "small" | "default" | "large";
  color?: "default" | "primary" | "secondary" | "destructive";
  className?: string;
}

export function CircularProgress({
  size = "default",
  color = "primary",
  className,
}: CircularProgressProps) {
  const sizeClasses = {
    small: "h-5 w-5 border-2",
    default: "h-8 w-8 border-2",
    large: "h-12 w-12 border-3",
  };

  const colorClasses = {
    default: "border-gray-300 border-t-gray-600",
    primary: "border-blue-200 border-t-blue-600",
    secondary: "border-purple-200 border-t-purple-600",
    destructive: "border-red-200 border-t-red-600",
  };

  return (
    <div
      className={cn(
        "inline-block rounded-full animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}

