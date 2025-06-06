
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-black/50 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white transform transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-white p-4 shadow-sm border-b flex items-center justify-between">
          <div className="text-lg font-bold text-primary">KidCheck</div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between bg-white p-4 shadow-sm border-b">
          <div className="text-2xl font-bold">
            {/* Dynamic title based on current route */}
            {window.location.pathname === '/dashboard' && 'Dashboard'}
            {window.location.pathname === '/staff' && 'Staff Management'}
            {window.location.pathname === '/children' && 'Children Management'}
            {window.location.pathname === '/classes' && 'Classes Management'}
            {window.location.pathname === '/check-in-out' && 'Check-In/Out Management'}
            {window.location.pathname === '/check-in-process' && 'Check-In Process'}
            {window.location.pathname === '/reports' && 'Reports & Analytics'}
            {window.location.pathname === '/settings' && 'System Settings'}
            {window.location.pathname === '/users' && 'User Management'}
            {window.location.pathname === '/roles' && 'Role Management'}
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                {user?.email?.substring(0, 1).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
        
        <Toaster />
      </div>
    </div>
  );
};

export default DashboardLayout;
