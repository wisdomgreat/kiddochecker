
import React from "react";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
};

export default MainLayout;
