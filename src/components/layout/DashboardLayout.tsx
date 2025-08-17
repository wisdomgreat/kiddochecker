
import React from "react";
import { useAuth } from "@/context/CleanAuthContext";
import TopNavigation from "./TopNavigation";
import { ModernSidebar } from "./ModernSidebar";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <ModernSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default DashboardLayout;
