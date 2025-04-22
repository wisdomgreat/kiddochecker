
import { cn } from "@/lib/utils";

type CircularProgressProps = {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "default";
  className?: string;
};

export const CircularProgress = ({
  size = "medium",
  color = "primary",
  className,
}: CircularProgressProps) => {
  const sizeMap = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  };

  const colorMap = {
    primary: "border-purple-500",
    secondary: "border-blue-500",
    default: "border-gray-300",
  };

  return (
    <div
      className={cn(
        "rounded-full border-4 border-t-transparent animate-spin",
        sizeMap[size],
        colorMap[color],
        className
      )}
    />
  );
};
