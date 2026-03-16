
import {
  Calendar, Home, Users, Settings, BarChart3, Building, LogOut,
  Baby, ClipboardCheck, BookOpen, UserCheck, Monitor, MessageSquare,
  QrCode, Printer, Zap, Shield, Activity, ShieldCheck,
  Trophy, HeartPulse, HelpCircle, LayoutGrid, Globe
} from "lucide-react";
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
import { Language } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AppSidebar() {
  const { user, userRole, isAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, verificationStatus, isVerifiedStaff, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const { unreadCount } = useMessages();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adminMenuGroups = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Center Finder", url: "/centers", icon: Globe },
        { title: "Calendar", url: "/calendar", icon: Calendar },
        { title: "Events Management", url: "/admin/events", icon: Calendar },
        { title: "Messages", url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: "Operations",
      items: [
        { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
        { title: "Kiosk Station", url: "/check-in", icon: Monitor },
        { title: "Attendance Rewards", url: "/admin/rewards", icon: Trophy },
      ]
    },
    {
      label: "People & Academics",
      items: [
        { title: "Children", url: "/children", icon: Baby },
        { title: "Staff", url: "/staff", icon: UserCheck },
        { title: "Staff Management", url: "/admin/shifts", icon: Calendar },
        { title: "Classes", url: "/classes", icon: BookOpen },
        { title: "Verify Staff", url: "/admin/verify-staff", icon: Shield },
      ]
    },
    {
      label: "System configuration",
      items: [
        { title: "User Management", url: "/users", icon: Users },
        { title: "QR Management", url: "/qr-management", icon: QrCode },
        { title: "Device Enrollment", url: "/devices", icon: Zap },
        ...(userRole === 'super_admin' ? [{ title: "Roles & Permissions", url: "/roles", icon: ShieldCheck }] : []),
        { title: "System Monitoring", url: "/reports", icon: BarChart3 },
      ]
    },

    {
      label: "Personal",
      items: [
        { title: "Settings", url: "/settings", icon: Settings },
        { title: "Help & Docs", url: "/help", icon: HelpCircle },
        { title: "My Profile", url: "/profile", icon: Users },
      ]
    }
  ];

  const staffMenuGroups = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Center Finder", url: "/centers", icon: Globe },
        { title: "Calendar", url: "/calendar", icon: Calendar },
        { title: "Messages", url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: "Operations",
      items: [
        ...(isStaff || isTeacher || isTeacherAssistant || userRole === 'volunteer' ? [{ title: "Attendance", url: "/attendance", icon: ClipboardCheck }] : []),
        { title: "Staff Schedules", url: "/staff/schedules", icon: Calendar },
        { title: "Classes", url: "/classes", icon: BookOpen },
      ]
    },
    {
      label: "Personal",
      items: [
        { title: "My Documents", url: "/staff/documents", icon: Shield },
        { title: "Help & Docs", url: "/help", icon: HelpCircle },
        { title: "My Profile", url: "/profile", icon: Users },
      ]
    }
  ];

  const unverifiedStaffMenuGroups = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Messages", url: "/messages", icon: MessageSquare },
      ]
    },
    {
      label: "Personal",
      items: [
        { title: "My Documents", url: "/staff/documents", icon: Shield },
        { title: "Help & Docs", url: "/help", icon: HelpCircle },
        { title: "My Profile", url: "/profile", icon: Users },
      ]
    }
  ];

  const parentMenuGroups = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Center Finder", url: "/centers", icon: Globe },
        { title: "Messages", url: "/parent/messages", icon: MessageSquare },
      ]
    },
    {
      label: "Family",
      items: [
        { title: "My Children", url: "/parent/children", icon: Baby },
        { title: "Attendance", url: "/parent/attendance", icon: Calendar },
      ]
    },
    {
      label: "Personal",
      items: [
        { title: "Profile", url: "/parent/profile", icon: Users },
        { title: "Help & Docs", url: "/help", icon: HelpCircle },
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
      case 'super_admin': return { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Super Admin' };
      case 'admin': return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Admin' };
      case 'teacher': return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Teacher' };
      case 'teacher_assistant': return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Asst. Teacher' };
      case 'staff': return { color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Staff' };
      case 'volunteer': return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Volunteer' };
      case 'parent': return { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Parent' };
      default: return { color: 'bg-slate-100 text-slate-800', label: userRole || 'User' };
    }
  };

  const { color, label } = getRoleBadgeConfig();

  return (
    <div className="h-screen p-4 pr-0 flex flex-col pointer-events-none">
      <Sidebar className="pointer-events-auto floating-island rounded-[2.5rem] border-none shadow-[LRB] h-full transition-all duration-500 weightless-shadow">
        <SidebarHeader className="border-b border-white/20 px-6 py-6 ring-offset-background">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shadow-sm bg-white/50 border border-white/40">
                <img src={settings.logo_url} alt="Organization Logo" className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-200">
                <Building className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="text-left flex-1 min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-900 truncate">
                {settings?.name || "KiddoChecker"}
              </h2>
              <Badge variant="outline" className={`text-[9px] px-2 py-0 h-4 font-black uppercase tracking-widest border-0 shadow-none ${color}`}>
                {label}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 py-6 scrollbar-none">
          {menuGroups.map((group, groupIdx) => (
            <SidebarGroup key={groupIdx} className="mb-4">
              <SidebarGroupLabel className="text-left mb-2 px-3 text-[10px] uppercase tracking-widest text-slate-400 font-black opacity-60">
                {groupIdx === 0 ? portalLabel : group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="w-full justify-start text-left rounded-2xl h-10 px-3 hover:bg-white/40 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                        >
                          <Link
                            to={item.url}
                            className={`flex items-center gap-3 w-full transition-all ${isActive
                              ? "bg-white/80 text-indigo-700 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                              }`}
                          >
                            <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-indigo-600 animate-pulse" : "text-slate-400"}`} />
                            <span className={`text-[13px] tracking-tight ${isActive ? "font-black" : "font-medium"}`}>{item.title}</span>
                            {item.title === "Messages" && unreadCount > 0 && (
                              <Badge className="ml-auto bg-indigo-600 text-[10px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full animate-bounce">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </Badge>
                            )}
                            {isActive && item.title !== "Messages" && <div className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600 transition-all shadow-[0_0_10px_rgba(79,70,229,0.5)]" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-white/20 p-6 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 bg-white/30 backdrop-blur-sm rounded-2xl p-2 border border-white/40">
            <Globe className="h-4 w-4 text-slate-400 ml-2" />
            <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
              <SelectTrigger className="h-8 border-none bg-transparent shadow-none focus:ring-0 text-[11px] font-black uppercase tracking-wider text-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 mb-4 bg-white/40 backdrop-blur-md rounded-3xl p-4 shadow-inner border border-white/50">
            <Avatar className="h-9 w-9 flex-shrink-0 rounded-2xl bg-indigo-100 ring-2 ring-white/60">
              <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-xs font-black">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">{user.email}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-left rounded-2xl h-11 px-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all font-bold text-xs gap-3 group"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            <span>Sign Out</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
