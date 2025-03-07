
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  QrCode,
  UserCog,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  userRole?: string | null;
  allowedRoles?: string[];
}

const SidebarItem = ({ icon, label, path, isActive, userRole, allowedRoles }: SidebarItemProps) => {
  // Don't render the item if user doesn't have required role
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return null;
  }
  
  return (
    <Link to={path} className={cn("sidebar-item", isActive && "active")}>
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userRole } = useAuth();
  
  const mainNavItems = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard", 
      path: userRole === 'admin' ? "/admin-dashboard" : userRole === 'staff' ? "/teacher-dashboard" : "/parent-dashboard",
      allowedRoles: ['admin', 'staff', 'parent']
    },
    { 
      icon: <GraduationCap size={20} />, 
      label: "Classes", 
      path: "/classes-management",
      allowedRoles: ['admin', 'staff']
    },
    { 
      icon: <Users size={20} />, 
      label: "Users", 
      path: "/users-management",
      allowedRoles: ['admin']
    },
    { 
      icon: <UserCog size={20} />, 
      label: "Staff", 
      path: "/staff-management",
      allowedRoles: ['admin']
    },
    { 
      icon: <BarChart3 size={20} />, 
      label: "Reports", 
      path: "/reports-dashboard",
      allowedRoles: ['admin', 'staff']
    },
    { 
      icon: <Settings size={20} />, 
      label: "Settings", 
      path: "/settings",
      allowedRoles: ['admin']
    },
  ];

  const quickAccessItems = [
    { 
      icon: <QrCode size={20} />, 
      label: "Check-in Kiosk", 
      path: "/check-in-kiosk",
      allowedRoles: ['admin', 'staff', 'parent']
    },
    { 
      icon: <QrCode size={20} />, 
      label: "Check-out Station", 
      path: "/check-out-station",
      allowedRoles: ['admin', 'staff']
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/landing"; // Redirect to landing page after sign out
  };

  return (
    <div className="h-screen flex flex-col bg-sidebar w-64 border-r border-gray-200 animate-slide-in">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <Link to="/" className="text-xl font-medium text-purple-600">
          ChurchCheck
        </Link>
        <button className="p-1 rounded-full hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
              userRole={userRole}
              allowedRoles={item.allowedRoles}
            />
          ))}
        </nav>

        <div>
          <h3 className="text-xs uppercase text-gray-500 font-medium mb-2 px-3">
            Quick Access
          </h3>
          <nav className="flex flex-col gap-1">
            {quickAccessItems.map((item) => (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={location.pathname === item.path}
                userRole={userRole}
                allowedRoles={item.allowedRoles}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{userRole || "User"}</p>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
