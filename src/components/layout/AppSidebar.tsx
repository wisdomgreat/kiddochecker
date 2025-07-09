
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Baby,
  Monitor,
  UserCheck,
  Building,
  AlertTriangle
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
  description?: string;
}

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const { signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items with strict role access
  const navigationItems: NavigationItem[] = [
    // Admin-only items
    { 
      name: "Admin Dashboard", 
      href: "/admin-dashboard", 
      icon: Home, 
      roles: ['admin', 'super_admin'],
      description: "Administrative overview"
    },
    { 
      name: "User Management", 
      href: "/users-management", 
      icon: Users, 
      roles: ['admin', 'super_admin'],
      description: "Manage all users"
    },
    { 
      name: "Staff Management", 
      href: "/staff-management", 
      icon: UserCheck, 
      roles: ['admin', 'super_admin'],
      description: "Manage staff members"
    },
    { 
      name: "Classes Management", 
      href: "/classes-management", 
      icon: BookOpen, 
      roles: ['admin', 'super_admin'],
      description: "Manage classes"
    },
    { 
      name: "Device Management", 
      href: "/device-management", 
      icon: Monitor, 
      roles: ['admin', 'super_admin'],
      description: "Manage devices"
    },
    { 
      name: "Organization Setup", 
      href: "/organization-setup", 
      icon: Building, 
      roles: ['admin', 'super_admin'],
      description: "Organization settings"
    },
    { 
      name: "System Settings", 
      href: "/settings", 
      icon: Settings, 
      roles: ['admin', 'super_admin'],
      description: "System configuration"
    },
    
    // Staff items
    { 
      name: "Staff Dashboard", 
      href: "/staff-dashboard", 
      icon: Home, 
      roles: ['staff', 'teacher', 'teacher_assistant'],
      description: "Staff overview"
    },
    { 
      name: "Check-In/Out", 
      href: "/check-in-out", 
      icon: ClipboardCheck, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant'],
      description: "Attendance management"
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: BarChart3, 
      roles: ['admin', 'super_admin', 'staff', 'teacher'],
      description: "View reports"
    },
    
    // Parent items
    { 
      name: "Parent Dashboard", 
      href: "/parent-dashboard", 
      icon: Home, 
      roles: ['parent'],
      description: "Parent overview"
    },
    { 
      name: "My Children", 
      href: "/children-management", 
      icon: Baby, 
      roles: ['parent'],
      description: "Manage your children"
    },
    
    // Common items (role-filtered)
    { 
      name: "Calendar", 
      href: "/calendar", 
      icon: Calendar, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent'],
      description: "View events and schedules"
    },
    { 
      name: "Family Connect", 
      href: "/family-connect", 
      icon: MessageSquare, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent'],
      description: "Communication center"
    },
  ];

  // Filter items based on user role
  const allowedItems = navigationItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin-dashboard" || href === "/staff-dashboard" || href === "/parent-dashboard") {
      return location.pathname === href || (location.pathname === "/" && href.includes("dashboard"));
    }
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    console.log('Navigating to:', href, 'Current role:', userRole);
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
    <Sidebar className={cn("border-r", collapsed ? "w-14" : "w-64")} collapsible>
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>KiddoChecker</span>
          </div>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        {/* Role Badge */}
        {!collapsed && (
          <div className="px-4 py-2 border-b">
            <Badge variant="outline" className={cn("text-xs", getRoleBadgeColor())}>
              {userRole?.replace('_', ' ').toUpperCase()}
            </Badge>
            {userRole === 'admin' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-700">Administrative Access</span>
              </div>
            )}
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      className={cn(
                        "w-full justify-start gap-3 h-10 px-3",
                        active ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground",
                        collapsed && "px-2 justify-center"
                      )}
                    >
                      <button onClick={() => handleNavigation(item.href)}>
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions for Kiosk Mode */}
        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff') && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button 
                      onClick={() => window.open('/check-in-kiosk', '_blank', 'fullscreen=yes')}
                      className="w-full justify-start gap-3 h-10 px-3 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Monitor className="h-4 w-4" />
                      {!collapsed && <span>Open Kiosk Mode</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <div className="mt-auto p-4 border-t">
        <SidebarMenuButton 
          asChild 
          className={cn(
            "w-full justify-start gap-3 h-10",
            collapsed && "px-2 justify-center"
          )}
        >
          <button onClick={handleSignOut}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </SidebarMenuButton>
      </div>
    </Sidebar>
  );
}
