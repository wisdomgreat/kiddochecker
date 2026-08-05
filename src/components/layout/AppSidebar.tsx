
import {
  Calendar, Home, Users, Settings, BarChart3, Building, LogOut,
  Baby, ClipboardCheck, BookOpen, UserCheck, Monitor, MessageSquare,
  QrCode, Printer, Shield, ShieldCheck,
  Trophy, HeartPulse, HelpCircle, Globe, Heart, Moon, Sun, Mail,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { user, userRole, isAdmin, isSuperAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, isVerifiedStaff, signOut, hasPermission } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { unreadCount } = useMessages();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    navigate("/login", { replace: true });
    await signOut();
  };

  const adminMenuGroups: MenuGroup[] = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/", icon: Home },
        { title: t("calendar"), url: "/calendar", icon: Calendar },
        { title: t("messages"), url: "/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("operations"),
      items: [
        { title: t("attendance"), url: "/attendance", icon: ClipboardCheck },
        { title: t("kioskStation"), url: "/check-in", icon: Monitor },
        { title: t("checkOut"), url: "/check-out", icon: LogOut },
        { title: t("attendanceRewards"), url: "/admin/rewards", icon: Trophy },
      ],
    },
    {
      label: t("peopleAcademics"),
      items: [
        { title: t("children"), url: "/children", icon: Baby },
        { title: t("staff"), url: "/staff", icon: UserCheck },
        { title: "Schedules", url: "/staff/schedules", icon: ClipboardCheck },
        { title: t("classes"), url: "/classes", icon: BookOpen },
        { title: t("verifyStaff"), url: "/admin/verify-staff", icon: Shield },
        { title: "Congregation", url: "/admin/church", icon: Heart },
      ],
    },
    {
      label: t("systemConfiguration"),
      items: [
        { title: t("userManagement"), url: "/users", icon: Users, requiredPermission: "manage_users" },
        { title: t("qrManagement"), url: "/qr-management", icon: QrCode, requiredPermission: "manage_qr_codes" },
        { title: t("emailTemplates"), url: "/admin/email-templates", icon: Mail, requiredPermission: "manage_system" },
        { title: t("deviceEnrollment"), url: "/devices", icon: Monitor },
        { title: t("rolesPermissions"), url: "/roles", icon: ShieldCheck, requiredPermission: "manage_users" },
        { title: t("auditLog"), url: "/audit-log", icon: Shield, requiredPermission: "view_audit_logs" },
        { title: t("systemHealth"), url: "/admin/system-health", icon: HeartPulse, requiredPermission: "manage_system" },
        { title: t("reportsAnalytics"), url: "/reports", icon: BarChart3, requiredPermission: "view_audit_logs" },
      ],
    },
    {
      label: t("personal"),
      items: [
        { title: t("settings"), url: "/settings", icon: Settings },
        { title: t("helpDocs"), url: "/help", icon: HelpCircle },
        { title: t("myProfile"), url: "/profile", icon: Users },
      ],
    },
  ];

  const staffMenuGroups: MenuGroup[] = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/", icon: Home },
        { title: t("calendar"), url: "/calendar", icon: Calendar },
        { title: t("messages"), url: "/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("operations"),
      items: [
        { title: t("kioskStation"), url: "/check-in", icon: Monitor },
        { title: t("checkOut"), url: "/check-out", icon: LogOut },
        ...(isStaff || isTeacher || isTeacherAssistant || userRole === "volunteer"
          ? [{ title: t("attendance"), url: "/attendance", icon: ClipboardCheck }]
          : []),
        { title: t("children"), url: "/children", icon: Baby },
        { title: t("staffSchedules"), url: "/staff/schedules", icon: Calendar },
        { title: t("classes"), url: "/classes", icon: BookOpen },
        { title: "Congregation", url: "/admin/church", icon: Heart, requiredPermission: "church_view" },
      ],
    },
    {
      label: t("personal"),
      items: [
        { title: t("myDocuments"), url: "/staff/documents", icon: Shield },
        { title: t("helpDocs"), url: "/help", icon: HelpCircle },
        { title: t("myProfile"), url: "/profile", icon: Users },
      ],
    },
  ];

  const unverifiedStaffMenuGroups: MenuGroup[] = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/", icon: Home },
        { title: t("messages"), url: "/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("personal"),
      items: [
        { title: t("myDocuments"), url: "/staff/documents", icon: Shield },
        { title: t("helpDocs"), url: "/help", icon: HelpCircle },
        { title: t("myProfile"), url: "/profile", icon: Users },
      ],
    },
  ];

  const parentMenuGroups: MenuGroup[] = [
    {
      label: t("overview"),
      items: [
        { title: t("dashboard"), url: "/", icon: Home },
        { title: t("messages"), url: "/parent/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("family"),
      items: [
        { title: t("myChildren"), url: "/parent/children", icon: Baby },
        { title: t("attendance"), url: "/parent/attendance", icon: Calendar },
        { title: t("events"), url: "/calendar", icon: Trophy },
      ],
    },
    {
      label: t("personal"),
      items: [
        { title: t("myProfile"), url: "/parent/profile", icon: Users },
        { title: t("helpDocs"), url: "/help", icon: HelpCircle },
      ],
    },
  ];

  const isStaffRole = isStaff || isTeacher || isTeacherAssistant || userRole === "volunteer";

  let menuGroups = parentMenuGroups;
  if (isAdmin || isSuperAdmin) {
    menuGroups = adminMenuGroups;
  } else if (isStaffRole) {
    menuGroups = isVerifiedStaff || userRole === "volunteer" ? staffMenuGroups : unverifiedStaffMenuGroups;
  }

  if (!user || userRole === "kiosk") return null;

  const getRoleConfig = () => {
    switch (userRole) {
      case "super_admin": return { color: "text-indigo-500", label: "Super Admin" };
      case "admin":       return { color: "text-indigo-500", label: "Admin" };
      case "teacher":     return { color: "text-emerald-500", label: "Teacher" };
      case "teacher_assistant": return { color: "text-emerald-500", label: "Asst. Teacher" };
      case "staff":       return { color: "text-slate-500", label: "Staff" };
      case "volunteer":   return { color: "text-amber-500", label: "Volunteer" };
      case "parent":      return { color: "text-rose-500", label: "Parent" };
      default:            return { color: "text-muted-foreground", label: userRole || "User" };
    }
  };

  const { color: roleColor, label: roleLabel } = getRoleConfig();

  return (
    <div className="h-screen flex flex-col">
      <Sidebar className="border-r border-border/50 bg-card h-full">
        {/* Logo / org header */}
        <SidebarHeader className="px-4 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                <img src={settings.logo_url} alt="Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Building className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-none truncate">
                {settings?.name || "KiddoChecker"}
              </p>
              <p className={cn("text-[11px] font-semibold mt-0.5", roleColor)}>{roleLabel}</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="py-3 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.requiredPermission) return true;
              return hasPermission(item.requiredPermission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="mb-1">
                {groupIdx > 0 && (
                  <div className="mx-4 my-2 border-t border-border/40" />
                )}
                <div className="px-3 space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    const isMsg = item.url === "/messages" || item.url === "/parent/messages";
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        className={cn("nav-item", isActive && "active")}
                      >
                        <item.icon className="h-[15px] w-[15px] flex-shrink-0" />
                        <span className="flex-1">{item.title}</span>
                        {isMsg && unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Super-admin dev & tenant panel */}
          {isSuperAdmin && (
            <div className="mx-3 mt-4 pt-4 border-t border-dashed border-border/40 space-y-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 mb-1">Super Admin Tenant Access</p>
                <Select
                  value={window.localStorage.getItem('kiosk_active_org_id') || '00000000-0000-0000-0000-000000000001'}
                  onValueChange={(val: string) => {
                    window.localStorage.setItem('kiosk_active_org_id', val);
                    window.localStorage.setItem('active_tenant_id', val);
                    window.location.reload();
                  }}
                >
                  <SelectTrigger className="h-8 text-[11px] bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                    <SelectValue placeholder="Switch Tenant / Church…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00000000-0000-0000-0000-000000000001">🇬🇧 English Congregation</SelectItem>
                    <SelectItem value="00000000-0000-0000-0000-000000000002">🇪🇸 Spanish Congregation</SelectItem>
                    <SelectItem value="all">🌍 All Tenants (Global View)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-1">Role Simulator</p>
                <Select
                  value={userRole || ""}
                  onValueChange={(val: any) => {
                    if (val === "reset") {
                      localStorage.removeItem("qa_simulate_role");
                    } else {
                      localStorage.setItem("qa_simulate_role", val);
                    }
                    window.location.reload();
                  }}
                >
                  <SelectTrigger className="h-8 text-[11px] bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                    <SelectValue placeholder="Simulate role…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reset">Super Admin (Default)</SelectItem>
                    <SelectItem value="admin">View as Organization Admin</SelectItem>
                    <SelectItem value="staff">View as Staff</SelectItem>
                    <SelectItem value="teacher">View as Teacher</SelectItem>
                    <SelectItem value="parent">View as Parent</SelectItem>
                    <SelectItem value="volunteer">View as Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-border/40 p-3 space-y-1.5">
          {/* User row */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-[12px] font-semibold truncate flex-1">{user.email}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1.5 px-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
              <SelectTrigger className="h-7 flex-1 border-none bg-transparent shadow-none focus:ring-0 text-[11px] font-medium px-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
