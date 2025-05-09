
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Calendar,
  User,
  Users,
  Home,
  School,
  BarChart2,
  Settings,
  LogOut,
  UserPlus,
  CheckCircle,
  Shield,
  Laptop,
} from "lucide-react";

const Sidebar = ({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) => {
  const { userRole, signOut } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const mainLinks = [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      roles: ["admin", "super_admin"],
    },
    {
      href: "/teacher-dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      roles: ["teacher", "teacher_assistant", "staff"],
    },
    {
      href: "/parent-dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      roles: ["parent"],
    },
    {
      href: "/events-management",
      label: "Events",
      icon: <Calendar size={20} />,
      roles: ["admin", "super_admin", "teacher", "teacher_assistant", "staff"],
    },
    {
      href: "/classes-management",
      label: "Classes",
      icon: <School size={20} />,
      roles: ["admin", "super_admin", "teacher", "teacher_assistant"],
    },
    {
      href: "/check-in-out",
      label: "Check In/Out",
      icon: <CheckCircle size={20} />,
      roles: ["admin", "super_admin", "teacher", "teacher_assistant", "staff"],
    },
    {
      href: "/users-management",
      label: "Users",
      icon: <Users size={20} />,
      roles: ["admin", "super_admin"],
    },
    {
      href: "/reports-dashboard",
      label: "Reports",
      icon: <BarChart2 size={20} />,
      roles: ["admin", "super_admin"],
    },
  ];

  const managementLinks = [
    {
      href: "/staff-management",
      label: "Staff",
      icon: <UserPlus size={20} />,
      roles: ["admin", "super_admin"],
    },
    {
      href: "/roles-management",
      label: "Roles",
      icon: <Shield size={20} />,
      roles: ["admin", "super_admin"],
    },
    {
      href: "/kiosk-management",
      label: "Devices & Kiosks",
      icon: <Laptop size={20} />,
      roles: ["admin", "super_admin"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings size={20} />,
      roles: ["admin", "super_admin"],
    },
  ];

  const userLinks = [
    {
      href: "/user-profile",
      label: "Profile",
      icon: <User size={20} />,
      roles: ["admin", "super_admin", "teacher", "teacher_assistant", "staff", "parent"],
    },
  ];

  const filteredMainLinks = userRole 
    ? mainLinks.filter(link => link.roles.includes(userRole))
    : [];
  
  const filteredManagementLinks = userRole 
    ? managementLinks.filter(link => link.roles.includes(userRole))
    : [];
  
  const filteredUserLinks = userRole 
    ? userLinks.filter(link => link.roles.includes(userRole))
    : [];

  // Add fallback for empty lists (for demo purposes)
  if (filteredMainLinks.length === 0) {
    filteredMainLinks.push({
      href: "/landing",
      label: "Home",
      icon: <Home size={20} />,
      roles: ["any"],
    });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/landing', { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 h-full py-4",
        collapsed ? "w-[70px]" : "w-[250px]",
        className
      )}
    >
      <div className="px-3 mb-6 flex items-center">
        <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-xl ml-2">KidCheck</span>
        )}
      </div>

      <div className="space-y-1 px-3">
        <h2
          className={cn(
            "text-xs font-semibold text-gray-400 px-2 py-1.5",
            collapsed && "sr-only"
          )}
        >
          MAIN MENU
        </h2>
        {filteredMainLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium",
                isActive
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100",
                collapsed && "justify-center"
              )
            }
          >
            <span className={cn("mr-2", collapsed && "mr-0")}>{link.icon}</span>
            {!collapsed && link.label}
          </NavLink>
        ))}
      </div>

      {filteredManagementLinks.length > 0 && (
        <div className="mt-6 space-y-1 px-3">
          <h2
            className={cn(
              "text-xs font-semibold text-gray-400 px-2 py-1.5",
              collapsed && "sr-only"
            )}
          >
            MANAGEMENT
          </h2>
          {filteredManagementLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-2 py-1.5 text-sm font-medium",
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "justify-center"
                )
              }
            >
              <span className={cn("mr-2", collapsed && "mr-0")}>
                {link.icon}
              </span>
              {!collapsed && link.label}
            </NavLink>
          ))}
        </div>
      )}

      {filteredUserLinks.length > 0 && (
        <div className="mt-6 space-y-1 px-3">
          <h2
            className={cn(
              "text-xs font-semibold text-gray-400 px-2 py-1.5",
              collapsed && "sr-only"
            )}
          >
            MY ACCOUNT
          </h2>
          {filteredUserLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-2 py-1.5 text-sm font-medium",
                  isActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "justify-center"
                )
              }
            >
              <span className={cn("mr-2", collapsed && "mr-0")}>
                {link.icon}
              </span>
              {!collapsed && link.label}
            </NavLink>
          ))}
        </div>
      )}

      <div className="mt-auto px-3">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center w-full rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100",
            collapsed && "justify-center"
          )}
          onClick={handleSignOut}
        >
          <LogOut size={20} className={cn("mr-2", collapsed && "mr-0")} />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
