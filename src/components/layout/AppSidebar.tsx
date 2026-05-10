
import {
  Calendar, Home, Users, Settings, BarChart3, Building, LogOut,
  Baby, ClipboardCheck, BookOpen, UserCheck, Monitor, MessageSquare,
  QrCode, Printer, Shield, Activity, ShieldCheck,
  Trophy, HeartPulse, HelpCircle, LayoutGrid, Globe, Heart, Moon, Sun, Mail,
  ChevronDown
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { Language, useTranslation } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  requiredPermission?: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function AppSidebar() {
  const { user, userRole, isAdmin, isSuperAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, verificationStatus, isVerifiedStaff, signOut, hasPermission } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { unreadCount } = useMessages();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Navigate immediately to login to make it feel instant
    navigate('/login', { replace: true });
    // Then do the background work
    await signOut();
  };

  const adminMenuGroups: MenuGroup[] = [
    {
      label: t('overview'),
      items: [
        { title: t('dashboard'), url: "/", icon: Home },
        { title: t('calendar'), url: "/calendar", icon: Calendar },
        { title: t('messages'), url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: t('operations'),
      items: [
        { title: t('attendance'), url: "/attendance", icon: ClipboardCheck },
        { title: t('kioskStation'), url: "/check-in", icon: Monitor },
        { title: t('attendanceRewards'), url: "/admin/rewards", icon: Trophy },
      ]
    },
    {
      label: t('peopleAcademics'),
      items: [
        { title: t('children'), url: "/children", icon: Baby },
        { title: t('staff'), url: "/staff", icon: UserCheck },
        { title: 'Schedules', url: "/staff/schedules", icon: ClipboardCheck },
        { title: t('classes'), url: "/classes", icon: BookOpen },
        { title: t('verifyStaff'), url: "/admin/verify-staff", icon: Shield },
        { title: 'Congregation', url: "/admin/church", icon: Heart },
      ]
    },
    {
      label: t('systemConfiguration'),
      items: [
        { title: t('userManagement'), url: "/users", icon: Users, requiredPermission: 'manage_users' },
        { title: t('qrManagement'), url: "/qr-management", icon: QrCode, requiredPermission: 'manage_qr_codes' },
        { title: t('emailTemplates'), url: "/admin/email-templates", icon: Mail, requiredPermission: 'manage_system' },
        { title: t('deviceEnrollment'), url: "/devices", icon: Monitor },
        { title: t('rolesPermissions'), url: "/roles", icon: ShieldCheck, requiredPermission: 'manage_users' },
        { title: t('auditLog'), url: "/audit-log", icon: Shield, requiredPermission: 'view_audit_logs' },
        { title: t('systemHealth'), url: "/admin/system-health", icon: HeartPulse, requiredPermission: 'manage_system' },
        { title: t('reportsAnalytics'), url: "/reports", icon: BarChart3, requiredPermission: 'view_audit_logs' },
      ]
    },

    {
      label: t('personal'),
      items: [
        { title: t('settings'), url: "/settings", icon: Settings },
        { title: t('helpDocs'), url: "/help", icon: HelpCircle },
        { title: t('myProfile'), url: "/profile", icon: Users },
      ]
    }
  ];

  const staffMenuGroups: MenuGroup[] = [
    {
      label: t('overview'),
      items: [
        { title: t('dashboard'), url: "/", icon: Home },
        { title: t('calendar'), url: "/calendar", icon: Calendar },
        { title: t('messages'), url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: t('operations'),
      items: [
        { title: t('kioskStation'), url: "/check-in", icon: Monitor },
        ...(isStaff || isTeacher || isTeacherAssistant || userRole === 'volunteer' ? [{ title: t('attendance'), url: "/attendance", icon: ClipboardCheck }] : []),
        { title: t('staffSchedules'), url: "/staff/schedules", icon: Calendar },
        { title: t('classes'), url: "/classes", icon: BookOpen },
        { title: 'Congregation', url: "/admin/church", icon: Heart, requiredPermission: 'church_view' },
      ]
    },
    {
      label: t('personal'),
      items: [
        { title: t('myDocuments'), url: "/staff/documents", icon: Shield },
        { title: t('helpDocs'), url: "/help", icon: HelpCircle },
        { title: t('myProfile'), url: "/profile", icon: Users },
      ]
    }
  ];

  const unverifiedStaffMenuGroups: MenuGroup[] = [
    {
      label: t('overview'),
      items: [
        { title: t('dashboard'), url: "/", icon: Home },
        { title: t('messages'), url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: t('personal'),
      items: [
        { title: t('myDocuments'), url: "/staff/documents", icon: Shield },
        { title: t('helpDocs'), url: "/help", icon: HelpCircle },
        { title: t('myProfile'), url: "/profile", icon: Users },
      ]
    }
  ];

  const parentMenuGroups: MenuGroup[] = [
    {
      label: t('overview'),
      items: [
        { title: t('dashboard'), url: "/", icon: Home },
        { title: t('messages'), url: "/parent/messages", icon: MessageSquare },
      ]
    },
    {
      label: t('family'),
      items: [
        { title: t('myChildren'), url: "/parent/children", icon: Baby },
        { title: t('attendance'), url: "/parent/attendance", icon: Calendar },
        { title: t('events'), url: "/calendar", icon: Trophy },
      ]
    },
    {
      label: t('personal'),
      items: [
        { title: t('myProfile'), url: "/parent/profile", icon: Users },
        { title: t('helpDocs'), url: "/help", icon: HelpCircle },
      ]
    }
  ];

  const isStaffRole = isStaff || isTeacher || isTeacherAssistant || userRole === "volunteer";

  let menuGroups = parentMenuGroups;
  if (isAdmin) {
    menuGroups = adminMenuGroups;
  } else if (isStaffRole) {
    menuGroups = isVerifiedStaff ? staffMenuGroups : unverifiedStaffMenuGroups;
  }
  const portalLabel = isAdmin
    ? 'Admin Dashboard'
    : isStaffRole
      ? userRole === 'teacher' ? 'Teacher Dashboard' : userRole === 'volunteer' ? 'Volunteer Station' : 'Staff Dashboard'
      : 'Parent Dashboard';

  if (!user || userRole === 'kiosk') return null;

  const getRoleBadgeConfig = (): { color: string; label: string } => {
    switch (userRole) {
      case 'super_admin': return { color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Super Admin' };
      case 'admin': return { color: 'badge-danger', label: 'Admin' };
      case 'teacher': return { color: 'badge-success', label: 'Teacher' };
      case 'teacher_assistant': return { color: 'badge-info', label: 'Asst. Teacher' };
      case 'staff': return { color: 'bg-muted text-muted-foreground border-transparent', label: 'Staff' };
      case 'volunteer': return { color: 'badge-warning', label: 'Volunteer' };
      case 'parent': return { color: 'bg-primary/10 text-primary border-primary/20', label: 'Parent' };
      default: return { color: 'bg-muted text-muted-foreground', label: userRole || 'User' };
    }
  };

  const { color, label } = getRoleBadgeConfig();

  return (
    <div className="h-screen flex flex-col">
      <Sidebar className="border-r bg-card text-card-foreground h-full transition-all">
        <SidebarHeader className="border-b px-6 py-6">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded border bg-muted/50">
                <img src={settings.logo_url} alt="Organization Logo" className="h-full w-full object-contain p-1" />
              </div>
            ) : (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground">
                <Building className="h-5 w-5" />
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <h2 className="text-lg font-bold tracking-tight truncate">
                {settings?.name || "KiddoChecker"}
              </h2>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 h-4 font-medium ${color}`}>
                {label}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          {menuGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(item => {
              const hasPerm = !item.requiredPermission || hasPermission(item.requiredPermission);
              const isCenterFinder = item.url === "/centers";
              const centerFinderEnabled = settings?.show_center_finder ?? true;
              
              if (isCenterFinder && !centerFinderEnabled) return false;
              return hasPerm;
            });

            if (visibleItems.length === 0) return null;

            return (
              <Collapsible key={groupIdx} defaultOpen={true} className="group/collapsible">
                <SidebarGroup className="mb-2">
                  <SidebarGroupLabel asChild className="text-left mb-1 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hover:bg-accent/50 rounded-md transition-colors cursor-pointer">
                    <CollapsibleTrigger className="flex w-full items-center justify-between">
                      {groupIdx === 0 ? portalLabel : group.label}
                      <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={cn(
                                  "w-full justify-start text-left rounded-md h-10 px-3 transition-colors",
                                  isActive 
                                    ? "bg-accent text-accent-foreground" 
                                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Link
                                  to={item.url}
                                  className="flex items-center gap-3 w-full"
                                >
                                  <item.icon className={cn(
                                    "h-4 w-4 flex-shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                  )} />
                                  <span className="text-sm font-medium">{item.title}</span>
                                  {(item.url === "/messages" || item.url === "/parent/messages") && unreadCount > 0 && (
                                    <Badge className="ml-auto bg-primary text-[10px] h-4 min-w-[16px] px-1 rounded-full">
                                      {unreadCount > 99 ? "99+" : unreadCount}
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="border-t p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center gap-2 border rounded-md px-2 py-1 bg-muted/30">
              <Globe className="h-3 w-3 text-muted-foreground ml-1" />
              <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
                <SelectTrigger className="h-7 border-none bg-transparent shadow-none focus:ring-0 text-[11px] font-medium p-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 rounded-md shrink-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
            <Avatar className="h-8 w-8 flex-shrink-0 rounded border">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-[11px] font-bold truncate">{user.email}</p>
              <p className="text-[10px] text-muted-foreground font-medium truncate">{label}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-left rounded-md h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm gap-2 mt-2"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('signOut')}</span>
          </Button>

          {isSuperAdmin && (
            <div className="pt-2 mt-2 border-t border-dashed">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-3 mb-2 tracking-widest">Dev Simulation</p>
              <Select 
                value={userRole || ''} 
                onValueChange={(val: any) => {
                  if (val === 'reset') {
                    localStorage.removeItem('qa_simulate_role');
                  } else {
                    localStorage.setItem('qa_simulate_role', val);
                  }
                  window.location.reload();
                }}
              >
                <SelectTrigger className="h-8 text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <SelectValue placeholder="Simulate Role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reset">Default (Original)</SelectItem>
                  <SelectItem value="parent">View as Parent</SelectItem>
                  <SelectItem value="staff">View as Staff</SelectItem>
                  <SelectItem value="teacher">View as Teacher</SelectItem>
                  <SelectItem value="admin">View as Admin</SelectItem>
                  <SelectItem value="volunteer">View as Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}


