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
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden font-sans transition-colors duration-500">
        {/* Background Decor */}
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-purple-500/5 dark:bg-purple-500/15 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-[20%] left-[10%] w-[20%] h-[20%] bg-blue-500/5 dark:bg-blue-600/5 blur-[100px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] bg-indigo-500/5 dark:bg-indigo-400/5 blur-[100px] rounded-full pointer-events-none z-0" />
        
        <AppSidebar />
        
        <main className="flex-1 overflow-auto antigravity-perspective relative z-10">
          <div className="p-6 lg:p-10 w-full max-w-[1600px] antigravity-stagger-in">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UnifiedDashboardLayout;