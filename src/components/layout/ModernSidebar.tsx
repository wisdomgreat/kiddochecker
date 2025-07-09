
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Baby,
  Monitor,
  UserCheck,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  adminOnly?: boolean;
  parentOnly?: boolean;
}

const ModernSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const canAccessAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canAccessParent = userRole === 'parent';

  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: Home },
    ...(canAccessAdmin ? [
      { name: "User Management", href: "/users-management", icon: Users, adminOnly: true },
      { name: "Staff Management", href: "/staff-management", icon: UserCheck, adminOnly: true },
      { name: "Classes Management", href: "/classes-management", icon: BookOpen, adminOnly: true },
      { name: "Device Management", href: "/device-management", icon: Monitor, adminOnly: true },
      { name: "Organization Setup", href: "/organization-setup", icon: Building, adminOnly: true },
      { name: "Settings", href: "/settings", icon: Settings, adminOnly: true },
    ] : []),
    ...(canAccessParent ? [
      { name: "My Children", href: "/children-management", icon: Baby, parentOnly: true },
    ] : []),
    { name: "Check-In/Out", href: "/check-in-out", icon: ClipboardCheck },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Family Connect", href: "/family-connect", icon: MessageSquare },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    console.log('Navigating to:', href);
    navigate(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'teacher':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'teacher_assistant':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'parent':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={cn(
      "flex h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">KiddoChecker</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Role Badge */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <Badge variant="outline" className={cn("text-xs", getRoleBadgeColor())}>
              {userRole?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.href}
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3",
                    active ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-gray-100 text-gray-700",
                    isCollapsed && "px-2 justify-center"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.name}</span>
                      {item.adminOnly && (
                        <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">
                          Admin
                        </Badge>
                      )}
                      {item.parentOnly && (
                        <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-600 border-amber-200">
                          Parent
                        </Badge>
                      )}
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-10",
              isCollapsed && "px-2 justify-center"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernSidebar;
