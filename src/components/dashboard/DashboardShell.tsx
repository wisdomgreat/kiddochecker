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
    <div className={cn("w-full space-y-3 sm:space-y-5", className)}>
      {/* Page header - tight horizontal row on mobile */}
      <div className="flex items-center justify-between gap-2.5 pb-0.5 animate-enter">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{title}</h1>
          <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 truncate">
            {subtitle ?? today}
          </p>
        </div>
        {action && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">{action}</div>
        )}
      </div>
      {children}
    </div>
  );
};

export default DashboardShell;
