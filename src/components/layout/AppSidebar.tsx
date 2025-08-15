
import { Calendar, Home, Users, Settings, BarChart3, Shield, UserPlus, Building, LogOut, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const { user, userRole, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin-dashboard",
      icon: Home,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Reports",
      url: "/admin/reports", 
      icon: BarChart3,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ];

  const parentItems = [
    {
      title: "Dashboard",
      url: "/parent-dashboard",
      icon: Home,
    },
    {
      title: "My Children",
      url: "/parent/children",
      icon: Users,
    },
    {
      title: "Attendance",
      url: "/parent/attendance",
      icon: Calendar,
    },
  ];

  const menuItems = isAdmin ? adminItems : parentItems;

  if (!user) return null;

  return (
    <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-4 w-4" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold">KiddoChecker</h2>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Admin Portal' : 'Parent Portal'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-left mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full justify-start text-left"
                  >
                    <Link to={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full justify-start text-left"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
