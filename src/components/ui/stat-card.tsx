
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
  actionLabel?: string;
  actionLink?: string;
  onClick?: () => void;
}

const StatCard = ({
  title,
  value,
  description,
  icon,
  className,
  actionLabel,
  actionLink,
  onClick,
}: StatCardProps) => {
  return (
    <div className={cn("stat-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        {icon && <div className="text-purple-500 mb-3">{icon}</div>}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-1">
            {title}
          </h3>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground mb-1">{description}</p>
            )}
          </div>
        </div>
      </div>
      {actionLabel && (
        <button
          onClick={onClick}
          className="mt-4 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors px-4 py-2 rounded-md w-full"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default StatCard;
