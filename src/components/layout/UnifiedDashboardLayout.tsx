import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface UnifiedDashboardLayoutProps {
  children: React.ReactNode;
}

const UnifiedDashboardLayout = ({ children }: UnifiedDashboardLayoutProps) => {
  const { user, userRole, loading, simulatedRole, setSimulatedRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background font-sans transition-colors flex-col md:flex-row">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto relative z-10 flex flex-col">
          {simulatedRole && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2 font-medium">
                <span className="font-bold uppercase tracking-wider bg-amber-500 text-amber-950 px-1.5 py-0.5 rounded text-[10px]">
                  Simulation Mode
                </span>
                <span>
                  Viewing interface & permissions as <strong>{simulatedRole.toUpperCase()}</strong>.
                </span>
              </div>
              <button
                onClick={() => setSimulatedRole(null)}
                className="text-[11px] font-bold underline hover:text-amber-950 dark:hover:text-amber-100 transition-colors"
              >
                Exit Simulation
              </button>
            </div>
          )}
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedDashboardLayout;

