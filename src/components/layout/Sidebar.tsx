import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  BarChart3,
  Baby
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, signOut, userRole } = useAuth();

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
    },
    {
      name: "Children",
      href: "/children",
      icon: Baby,
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
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
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
    <div className={cn("flex flex-col w-64 border-r border-border bg-secondary h-full", className)}>
      <div className="p-4 flex-shrink-0">
        <Link to="/" className="font-semibold text-lg">
          KidCheck Admin
        </Link>
      </div>
      <div className="flex flex-col flex-grow p-4">
        <nav className="flex flex-col space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-2 rounded-md p-2 hover:bg-muted",
                location.pathname === item.href ? "bg-muted font-medium" : ""
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}
        </p>
        <Button variant="outline" className="mt-2 w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
        {userRole && (
          <p className="mt-2 text-sm text-muted-foreground">
            Role: {userRole}
          </p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;


