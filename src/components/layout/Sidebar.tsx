
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Settings,
  LayoutDashboard,
  List,
  User,
  Calendar,
  FileText,
  LogOut,
  School,
  Clock,
  Shield,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { pathname } = useLocation();
  const { user, userRole, signOut } = useAuth();

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isTeacher = userRole === "teacher" || userRole === "teacher_assistant";
  const isStaff = userRole === "staff";

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      showTo: ["all"]
    },
    {
      title: "Children",
      href: "/children",
      icon: User,
      showTo: ["admin", "teacher", "staff", "parent"]
    },
    {
      title: "Staff",
      href: "/staff",
      icon: Users,
      showTo: ["admin"]
    },
    {
      title: "Classes",
      href: "/classes",
      icon: School,
      showTo: ["admin", "teacher", "staff"]
    },
    {
      title: "Check-In/Out",
      href: "/check-in-out",
      icon: Clock,
      showTo: ["admin", "teacher", "staff"]
    },
    {
      title: "Check-In Process",
      href: "/check-in-process",
      icon: Clock,
      showTo: ["admin", "teacher", "staff"]
    },
    {
      title: "Check-In Setup",
      href: "/check-in-setup",
      icon: Settings,
      showTo: ["admin"]
    },
    {
      title: "Reports",
      href: "/reports",
      icon: FileText,
      showTo: ["admin", "teacher"]
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
      showTo: ["admin", "teacher", "staff", "parent"]
    },
    {
      title: "Users",
      href: "/users",
      icon: Users,
      showTo: ["admin"]
    },
    {
      title: "Roles",
      href: "/roles",
      icon: Shield,
      showTo: ["admin"]
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      showTo: ["admin"]
    },
    {
      title: "Parent Home",
      href: "/parent-dashboard",
      icon: Home,
      showTo: ["parent"]
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.showTo.includes("all") || 
    (isAdmin && item.showTo.includes("admin")) ||
    (isTeacher && item.showTo.includes("teacher")) ||
    (isStaff && item.showTo.includes("staff")) ||
    (userRole === "parent" && item.showTo.includes("parent"))
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn("w-64 bg-white border-r h-full p-4 flex flex-col", className)}>
      <div className="flex items-center justify-center mb-8 pt-4">
        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
          <div className="font-bold text-xl">KidCheck</div>
        </div>
      </div>
      
      <nav className="space-y-1 flex-1">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.title}
          </Link>
        ))}
      </nav>
      
      {user && (
        <div className="mt-auto pt-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              {user.email?.substring(0, 1).toUpperCase() || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-700">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
