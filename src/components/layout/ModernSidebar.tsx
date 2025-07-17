
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  UserCog, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  Home,
  QrCode,
  LogOut as LogOutIcon,
  BookOpen,
  Shield,
  Clock,
  Heart
} from "lucide-react";

const ModernSidebar = () => {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { userRole, signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = (path: string) => {
    const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors";
    if (isActive(path)) {
      return `${baseClasses} bg-primary text-primary-foreground`;
    }
    return `${baseClasses} hover:bg-accent hover:text-accent-foreground`;
  };

  // Define navigation items based on role
  const getNavigationItems = () => {
    const commonItems = [
      { to: "/help", icon: HelpCircle, label: "Help & Support" },
    ];

    switch (userRole) {
      case 'parent':
        return [
          { to: "/parent-dashboard", icon: Home, label: "Dashboard" },
          { to: "/children", icon: Users, label: "My Children" },
          { to: "/messages", icon: MessageSquare, label: "Messages" },
          { to: "/events", icon: Calendar, label: "Events" },
          ...commonItems,
        ];

      case 'staff':
        return [
          { to: "/staff-dashboard", icon: Home, label: "Dashboard" },
          { to: "/check-in-kiosk", icon: QrCode, label: "Check-In Kiosk" },
          { to: "/check-out-station", icon: LogOutIcon, label: "Check-Out Station" },
          { to: "/attendance", icon: ClipboardList, label: "Attendance" },
          { to: "/children", icon: Users, label: "All Children" },
          { to: "/classes", icon: BookOpen, label: "Classes" },
          { to: "/messages", icon: MessageSquare, label: "Messages" },
          { to: "/staff-realtime-dashboard", icon: Clock, label: "Real-time Dashboard" },
          ...commonItems,
        ];

      case 'teacher':
      case 'teacher_assistant':
        return [
          { to: "/teacher-dashboard", icon: Home, label: "Dashboard" },
          { to: "/check-in-kiosk", icon: QrCode, label: "Check-In Assistance" },
          { to: "/attendance", icon: ClipboardList, label: "Attendance" },
          { to: "/classes", icon: BookOpen, label: "My Classes" },
          { to: "/children", icon: Users, label: "Students" },
          { to: "/messages", icon: MessageSquare, label: "Messages" },
          ...commonItems,
        ];

      case 'volunteer':
        return [
          { to: "/volunteer-dashboard", icon: Heart, label: "Dashboard" },
          { to: "/check-in-kiosk", icon: QrCode, label: "Check-In Help" },
          ...commonItems,
        ];

      case 'admin':
      case 'super_admin':
        return [
          { to: "/admin-dashboard", icon: Home, label: "Admin Dashboard" },
          { to: "/check-in-kiosk", icon: QrCode, label: "Check-In Kiosk" },
          { to: "/check-out-station", icon: LogOutIcon, label: "Check-Out Station" },
          { to: "/attendance", icon: ClipboardList, label: "Attendance" },
          { to: "/children", icon: Users, label: "Children" },
          { to: "/classes", icon: BookOpen, label: "Classes" },
          { to: "/users", icon: UserCog, label: "Users" },
          { to: "/roles", icon: Shield, label: "Roles & Permissions" },
          { to: "/messages", icon: MessageSquare, label: "Messages" },
          { to: "/events", icon: Calendar, label: "Events" },
          { to: "/organization", icon: Settings, label: "Organization" },
          { to: "/staff-realtime-dashboard", icon: Clock, label: "Real-time Dashboard" },
          ...commonItems,
        ];

      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={`${collapsed ? "w-16" : "w-64"} bg-background border-r border-border h-full flex flex-col`}>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-border">
        {!collapsed ? (
          <h2 className="text-lg font-semibold">Childcare System</h2>
        ) : (
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={getNavCls(item.to)}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left"
        >
          <LogOutIcon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default ModernSidebar;
