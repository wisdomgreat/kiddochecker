import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared dashboard page wrapper — consistent header, spacing, and entrance animation.
 */
const DashboardShell = ({
  title,
  subtitle,
  action,
  children,
  className,
}: DashboardShellProps) => {
  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className={cn("w-full space-y-4 sm:space-y-6", className)}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-0.5 animate-enter">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitle ?? today}
          </p>
        </div>
        {action && (
          <div className="flex items-center gap-2 shrink-0">{action}</div>
        )}
      </div>
      {children}
    </div>
  );
};

export default DashboardShell;
