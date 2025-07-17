
import { useState } from "react";
import { 
  Home, 
  Users, 
  UserCog, 
  Shield, 
  Calendar, 
  BarChart3, 
  Settings, 
  Baby, 
  GraduationCap,
  ClipboardCheck,
  MessageSquare,
  Monitor,
  HelpCircle,
  LogOut,
  ChevronDown,
  Plus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/admin-dashboard",
    permission: "view_system_health",
    badge: null
  },
  {
    title: "User Management",
    icon: Users,
    permission: "view_users",
    items: [
      { title: "All Users", url: "/users-management", permission: "view_users" },
      { title: "Staff Management", url: "/staff-management", permission: "view_users" },
      { title: "Roles & Permissions", url: "/roles-management", permission: "view_roles" },
      { title: "Role Permissions", url: "/role-permissions-management", permission: "view_permissions" }
    ]
  },
  {
    title: "Children & Classes",
    icon: Baby,
    permission: "view_all_children",
    items: [
      { title: "Children", url: "/children", permission: "view_all_children" },
      { title: "Classes", url: "/classes", permission: "view_classes" },
      { title: "Teachers", url: "/teachers", permission: "view_classes" }
    ]
  },
  {
    title: "Attendance",
    icon: ClipboardCheck,
    permission: "view_attendance",
    items: [
      { title: "Daily Attendance", url: "/attendance", permission: "view_attendance" },
      { title: "Check-in Kiosk", url: "/kiosk", permission: "checkin_children" },
      { title: "Reports", url: "/attendance-reports", permission: "view_attendance_reports" }
    ]
  },
  {
    title: "Events & Calendar",
    icon: Calendar,
    permission: "view_events",
    items: [
      { title: "All Events", url: "/events", permission: "view_events" },
      { title: "Calendar View", url: "/calendar", permission: "view_events" },
      { title: "Event Registration", url: "/event-registration", permission: "manage_event_registration" }
    ]
  },
  {
    title: "Communication",
    icon: MessageSquare,
    permission: "view_messages",
    items: [
      { title: "Messages", url: "/messages", permission: "view_messages" },
      { title: "Announcements", url: "/announcements", permission: "broadcast_messages" },
      { title: "Notifications", url: "/notifications", permission: "send_messages" }
    ]
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    permission: "view_basic_reports",
    items: [
      { title: "Overview", url: "/reports", permission: "view_basic_reports" },
      { title: "Detailed Analytics", url: "/analytics", permission: "view_detailed_reports" },
      { title: "Export Data", url: "/export", permission: "export_reports" }
    ]
  },
  {
    title: "System & Devices",
    icon: Monitor,
    permission: "view_devices",
    items: [
      { title: "Devices", url: "/devices", permission: "view_devices" },
      { title: "System Health", url: "/system-health", permission: "view_system_health" },
      { title: "Integrations", url: "/integrations", permission: "manage_integrations" }
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    permission: "view_organization_settings",
    items: [
      { title: "Organization", url: "/organization-settings", permission: "view_organization_settings" },
      { title: "Security", url: "/security-settings", permission: "manage_system_settings" },
      { title: "Backup & Recovery", url: "/backup", permission: "manage_backups" }
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { checkPermission } = usePermissions();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (items: any[]) => items.some(item => isActive(item.url));

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    );
  };

  const getNavClass = (active: boolean) => 
    active 
      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
      : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">ChildCare Pro</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        <SidebarTrigger />
      </div>

      <SidebarContent className="flex-1 overflow-y-auto">
        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <Button size="sm" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Quick Add
            </Button>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (item.items) {
                  const isGroupOpen = openGroups.includes(item.title);
                  const groupActive = isGroupActive(item.items);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Collapsible 
                        open={isGroupOpen} 
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className={getNavClass(groupActive)}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1">{item.title}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!isCollapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.url}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink 
                                      to={subItem.url} 
                                      className={({ isActive }) => getNavClass(isActive)}
                                    >
                                      <span>{subItem.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                } else {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={({ isActive }) => getNavClass(isActive)}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Section */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Support</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Documentation
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <UserCog className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start" 
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full p-2" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Sidebar>
  );
}
