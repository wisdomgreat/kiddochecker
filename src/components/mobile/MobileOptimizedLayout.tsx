
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileOptimizedLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
}

export const MobileOptimizedLayout = ({ 
  children, 
  className,
  showHeader = true,
  headerTitle = "KiddoChecker"
}: MobileOptimizedLayoutProps) => {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {showHeader && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {headerTitle}
          </h1>
        </div>
      )}
      
      <div className="p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedLayout;
