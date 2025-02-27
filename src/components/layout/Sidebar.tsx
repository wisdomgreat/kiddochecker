
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  QrCode,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, path, isActive }: SidebarItemProps) => (
  <Link to={path} className={cn("sidebar-item", isActive && "active")}>
    {icon}
    <span className="text-sm">{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentUser = {
    name: "John Smith",
    role: "Admin",
    avatar: "/lovable-uploads/029d2e1a-eb1f-4149-89ea-500a876d3568.png"
  };

  const mainNavItems = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard", 
      path: "/" 
    },
    { 
      icon: <GraduationCap size={20} />, 
      label: "Classes", 
      path: "/classes" 
    },
    { 
      icon: <Users size={20} />, 
      label: "Users", 
      path: "/users" 
    },
    { 
      icon: <BarChart3 size={20} />, 
      label: "Reports", 
      path: "/reports" 
    },
    { 
      icon: <Settings size={20} />, 
      label: "Settings", 
      path: "/settings" 
    },
  ];

  const quickAccessItems = [
    { 
      icon: <QrCode size={20} />, 
      label: "Check-in Kiosk", 
      path: "/check-in" 
    },
    { 
      icon: <QrCode size={20} />, 
      label: "Check-out Station", 
      path: "/check-out" 
    },
  ];

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
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full bg-gray-200 object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentUser.name}</p>
          <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
