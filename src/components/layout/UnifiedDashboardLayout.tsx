import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useMessages } from "@/hooks/useMessages";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navigate, Link } from "react-router-dom";
import { Loader2, Building, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedDashboardLayoutProps {
  children: React.ReactNode;
}

const UnifiedDashboardLayout = ({ children }: UnifiedDashboardLayoutProps) => {
  const { user, userRole, loading, simulatedRole, setSimulatedRole } = useAuth();
  const { settings } = useSettings();
  const { unreadCount } = useMessages();

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
          {/* Mobile Top Navigation Header (only on mobile screens < md) */}
          <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-11 sm:h-12 px-3 border-b border-border/50 bg-background/95 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="h-7 w-7 text-foreground hover:bg-muted -ml-1" />
              <div className="flex items-center gap-1.5 min-w-0">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-5 w-5 rounded object-contain flex-shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded bg-primary flex items-center justify-center flex-shrink-0">
                    <Building className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="font-bold text-[12px] sm:text-[13px] truncate text-foreground">
                  {settings?.name || "KiddoChecker"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {unreadCount > 0 && (
                <Link
                  to="/messages"
                  className="relative p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                </Link>
              )}
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-border/60 bg-muted/50 text-muted-foreground">
                {simulatedRole ? `Sim: ${simulatedRole}` : (userRole || "User")}
              </span>
            </div>
          </header>

          {simulatedRole && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 text-xs flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-medium min-w-0 truncate">
                <span className="font-bold uppercase tracking-wider bg-amber-500 text-amber-950 px-1 py-0.2 rounded text-[9px] shrink-0">
                  Simulation
                </span>
                <span className="text-[11px] truncate">
                  Viewing as <strong>{simulatedRole.toUpperCase()}</strong>
                </span>
              </div>
              <button
                onClick={() => setSimulatedRole(null)}
                className="text-[10px] sm:text-[11px] font-bold underline hover:text-amber-950 dark:hover:text-amber-100 transition-colors shrink-0"
              >
                Exit
              </button>
            </div>
          )}
          <div className="p-2.5 sm:p-5 lg:p-6 w-full max-w-7xl mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedDashboardLayout;

