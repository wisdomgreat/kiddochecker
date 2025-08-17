import { useAuth } from "@/context/CleanAuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, LogOut, BarChart3, Calendar, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  className?: string;
}

export const ModernSidebar = ({ className }: SidebarProps = {}) => {
  const { signOut, userRole, isAdmin } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      requireAdmin: true,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      requireAdmin: true,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn("flex flex-col border-r bg-secondary/50 w-60", className)}>
      <div className="px-4 py-6">
        <Link to="/" className="font-semibold text-lg">
          KiddoCheck
        </Link>
      </div>
      <nav className="flex flex-col flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          if (item.requireAdmin && !isAdmin) {
            return null;
          }

          const active = location.pathname === item.href;

          return (
            <Link key={item.href} to={item.href}>
              <Button variant="ghost" className={cn("justify-start", active ? "bg-accent" : "hover:bg-accent", "w-full")}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
      {/* Logout Button */}
      <div className="p-4">
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
