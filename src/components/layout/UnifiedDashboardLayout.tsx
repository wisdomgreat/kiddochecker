import React from "react";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface UnifiedDashboardLayoutProps {
  children: React.ReactNode;
}

const UnifiedDashboardLayout = ({ children }: UnifiedDashboardLayoutProps) => {
  const { user, userRole, loading } = useAuth();

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
      <div className="min-h-screen flex w-full bg-background font-sans transition-colors">
        <AppSidebar />
        
        <main className="flex-1 overflow-auto relative z-10">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedDashboardLayout;
