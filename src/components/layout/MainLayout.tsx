
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Reset mobile menu state when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile menu toggle */}
      <div className="md:hidden fixed top-0 left-0 z-30 p-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile by default, visible when mobileMenuOpen is true */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-20 transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <Sidebar collapsed={sidebarCollapsed} className="h-full" />
      </div>
      
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-14 md:pt-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
