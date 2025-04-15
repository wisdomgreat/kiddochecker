import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  CalendarCheck,
  Users,
  Home,
  GraduationCap,
  BarChart2,
  Settings,
  Tent,
  LogOut,
  UserCircle,
  UserCog,
  Calendar,
  ShieldCheck,
  MonitorSmartphone
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

  const mainLinks = [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      roles: ["admin"],
    },
    {
      href: "/teacher-dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      roles: ["teacher"],
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
      roles: ["admin", "teacher"],
    },
    {
      href: "/classes-management",
      label: "Classes",
      icon: <GraduationCap size={20} />,
      roles: ["admin", "teacher"],
    },
    {
      href: "/users-management",
      label: "Users",
      icon: <Users size={20} />,
      roles: ["admin"],
    },
    {
      href: "/reports-dashboard",
      label: "Reports",
      icon: <BarChart2 size={20} />,
      roles: ["admin"],
    },
  ];

  const managementLinks = [
    {
      href: "/staff-management",
      label: "Staff",
      icon: <UserCog size={20} />,
      roles: ["admin"],
    },
    {
      href: "/roles-management",
      label: "Roles",
      icon: <ShieldCheck size={20} />,
      roles: ["admin"],
    },
    {
      href: "/kiosk-management",
      label: "Kiosks",
      icon: <MonitorSmartphone size={20} />,
      roles: ["admin"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings size={20} />,
      roles: ["admin"],
    },
  ];

  const userLinks = [
    {
      href: "/user-profile",
      label: "Profile",
      icon: <UserCircle size={20} />,
      roles: ["admin", "teacher", "parent"],
    },
    {
      href: "/check-in-process",
      label: "Check-in",
      icon: <CalendarCheck size={20} />,
      roles: ["admin", "parent"],
    },
  ];

  const filteredMainLinks = mainLinks.filter((link) =>
    link.roles.includes(userRole || "")
  );
  
  const filteredManagementLinks = managementLinks.filter((link) =>
    link.roles.includes(userRole || "")
  );
  
  const filteredUserLinks = userLinks.filter((link) =>
    link.roles.includes(userRole || "")
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 h-full py-4",
        collapsed ? "w-[70px]" : "w-[250px]",
        className
      )}
    >
      <div className="px-3 mb-6 flex items-center">
        <Tent className="h-6 w-6 text-purple-600 flex-shrink-0" />
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
          onClick={signOut}
        >
          <LogOut size={20} className={cn("mr-2", collapsed && "mr-0")} />
          {!collapsed && "Sign Out"}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
