
import {
  Calendar, Home, Users, Settings, BarChart3, Building, LogOut,
  Baby, ClipboardCheck, BookOpen, UserCheck, Monitor, MessageSquare,
  QrCode, Printer, Zap, Shield, Activity, ShieldCheck,
  Trophy, HeartPulse, HelpCircle, LayoutGrid, Globe, Heart, Moon, Sun, Mail
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
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
  const { user, userRole, isAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, verificationStatus, isVerifiedStaff, signOut, hasPermission } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { unreadCount } = useMessages();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adminMenuGroups: MenuGroup[] = [
    {
      label: t('overview'),
      items: [
        { title: t('dashboard'), url: "/", icon: Home },
        { title: t('centerFinder'), url: "/centers", icon: Globe },
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
        { title: t('shiftAutoPlanner'), url: "/staff/schedules", icon: ClipboardCheck },
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
        { title: t('auditLog'), url: "/audit-log", icon: Activity, requiredPermission: 'view_audit_logs' },
        { title: t('systemHealth'), url: "/admin/system-health", icon: HeartPulse, requiredPermission: 'manage_system' },
        { title: t('systemMonitoring'), url: "/reports", icon: BarChart3, requiredPermission: 'view_audit_logs' },
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
        { title: t('centerFinder'), url: "/centers", icon: Globe },
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
        { title: t('centerFinder'), url: "/centers", icon: Globe },
        { title: t('messages'), url: "/parent/messages", icon: MessageSquare },
      ]
    },
    {
      label: t('family'),
      items: [
        { title: t('myChildren'), url: "/parent/children", icon: Baby },
        { title: t('attendance'), url: "/parent/attendance", icon: Calendar },
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
    ? 'Admin Portal'
    : isStaffRole
      ? userRole === 'teacher' ? 'Teacher Portal' : userRole === 'volunteer' ? 'Volunteer Station' : 'Staff Portal'
      : 'Parent Portal';

  if (!user) return null;

  const getRoleBadgeConfig = (): { color: string; label: string } => {
    switch (userRole) {
      case 'super_admin': return { color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', label: 'Super Admin' };
      case 'admin': return { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800', label: 'Admin' };
      case 'teacher': return { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', label: 'Teacher' };
      case 'teacher_assistant': return { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Asst. Teacher' };
      case 'staff': return { color: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', label: 'Staff' };
      case 'volunteer': return { color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'Volunteer' };
      case 'parent': return { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Parent' };
      default: return { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', label: userRole || 'User' };
    }
  };

  const { color, label } = getRoleBadgeConfig();

  return (
    <div className="h-screen p-4 pr-0 flex flex-col pointer-events-none">
      <Sidebar className="pointer-events-auto floating-island rounded-[2.5rem] border-none shadow-[LRB] dark:shadow-black/60 h-full transition-all duration-500 weightless-shadow overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
        <SidebarHeader className="border-b border-white/20 dark:border-white/5 px-6 py-6 ring-offset-background">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shadow-sm bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/5">
                <img src={settings.logo_url} alt="Organization Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-200 dark:shadow-indigo-500/10">
                <Building className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                {settings?.name || "KiddoChecker"}
              </h2>
              <Badge variant="outline" className={`text-[9px] px-2 py-0 h-4 font-black uppercase tracking-widest border-0 shadow-none ${color}`}>
                {label}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-6 scrollbar-none">
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
              <SidebarGroup key={groupIdx} className="mb-4">
                <SidebarGroupLabel className="text-left mb-2 px-3 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black opacity-60">
                  {groupIdx === 0 ? portalLabel : group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "w-full justify-start text-left rounded-2xl h-11 px-4 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]",
                              isActive ? "bg-white/80 dark:bg-white/10 shadow-sm dark:shadow-black/20" : "hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                          >
                            <Link
                              to={item.url}
                              className={`flex items-center gap-3 w-full transition-all ${isActive
                                ? "text-indigo-700 dark:text-indigo-400"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                }`}
                            >
                              <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"}`} />
                              <span className={`text-sm tracking-tight ${isActive ? "font-black" : "font-medium"}`}>{item.title}</span>
                              {(item.url === "/messages" || item.url === "/parent/messages") && unreadCount > 0 && (
                                <Badge className="ml-auto bg-indigo-600 text-xs px-2 h-5 min-w-[20px] flex items-center justify-center rounded-full">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </Badge>
                              )}
                              {isActive && item.url !== "/messages" && item.url !== "/parent/messages" && <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600 transition-all shadow-[0_0_10px_rgba(79,70,229,0.5)]" />}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/20 dark:border-white/5 p-6 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-2 bg-white/30 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/40 dark:border-white/5">
              <Globe className="h-4 w-4 text-slate-400 dark:text-slate-600 ml-2" />
              <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
                <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:shadow-black/60 bg-white dark:bg-slate-900">
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
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-12 w-12 rounded-2xl bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-4 bg-slate-50 dark:bg-white/5 rounded-3xl p-4 shadow-inner border border-slate-100 dark:border-white/5">
            <Avatar className="h-10 w-10 flex-shrink-0 rounded-2xl bg-indigo-100 dark:bg-indigo-900 ring-2 ring-white/60 dark:ring-white/10 shadow-sm">
              <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-xs font-black">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{user.email}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">{label}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-left rounded-2xl h-12 px-4 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-all font-bold text-sm gap-3 group"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            <span>{t('signOut')}</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
