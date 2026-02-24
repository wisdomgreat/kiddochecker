
import { Calendar, Home, Users, Settings, BarChart3, Building, LogOut, Baby, FileText, ClipboardCheck, BookOpen, UserCheck, Monitor, MessageSquare } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { user, userRole, isAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adminItems = [
    { title: "Dashboard", url: "/admin-dashboard", icon: Home },
    { title: "User Management", url: "/users", icon: Users },
    { title: "Staff", url: "/staff", icon: UserCheck },
    { title: "Children", url: "/children", icon: Baby },
    { title: "Classes", url: "/classes", icon: BookOpen },
    { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Check-In Kiosk", url: "/check-in", icon: Monitor },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const staffItems = [
    { title: "Dashboard", url: "/staff-dashboard", icon: Home },
    { title: "Check-In", url: "/check-in", icon: Monitor },
    { title: "Check-Out", url: "/check-out", icon: ClipboardCheck },
    { title: "Children", url: "/children", icon: Baby },
    { title: "Classes", url: "/classes", icon: BookOpen },
    { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Messages", url: "/messages", icon: MessageSquare },
  ];

  const parentItems = [
    { title: "Dashboard", url: "/parent-dashboard", icon: Home },
    { title: "My Children", url: "/parent/children", icon: Baby },
    { title: "Attendance", url: "/parent/attendance", icon: Calendar },
    { title: "Messages", url: "/parent/messages", icon: MessageSquare },
    { title: "Profile", url: "/parent/profile", icon: Users },
  ];

  // Determine which menu items to show based on role
  const isStaffRole = isStaff || isTeacher || isTeacherAssistant;
  const menuItems = isAdmin ? adminItems : isStaffRole ? staffItems : parentItems;
  const portalLabel = isAdmin ? 'Admin Portal' : isStaffRole ? 'Staff Portal' : 'Parent Portal';

  if (!user) return null;

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'teacher_assistant': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      case 'parent': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sidebar className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-64">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-4 w-4" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-lg font-semibold truncate">KiddoChecker</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor()}`}>
                {userRole?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-left mb-2 px-2">
            {portalLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="w-full justify-start text-left"
                  >
                    <Link to={item.url} className="flex items-center gap-3 w-full px-3 py-2">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
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
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">
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
          <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
