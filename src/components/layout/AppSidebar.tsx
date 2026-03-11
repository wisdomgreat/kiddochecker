
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

export function AppSidebar() {
  const { user, userRole, isAdmin, isParent, isStaff, isTeacher, isTeacherAssistant, verificationStatus, isVerifiedStaff, signOut } = useAuth();
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
    <Sidebar className="border-r border-slate-100 bg-white w-64">
      <SidebarHeader className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          {settings?.logo_url ? (
            <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm bg-slate-50 border border-slate-100">
               <img src={settings.logo_url} alt="Organization Logo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex shrink-0 h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Building className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="text-left flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {settings?.name || "KiddoChecker"}
            </h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${color}`}>
              {label}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {menuGroups.map((group, groupIdx) => (
          <SidebarGroup key={groupIdx}>
            <SidebarGroupLabel className="text-left mb-1 px-2 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              {groupIdx === 0 ? portalLabel : group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="w-full justify-start text-left rounded-xl"
                      >
                        <Link
                          to={item.url}
                          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                          <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className="truncate">{item.title}</span>
                          {item.title === "Messages" && unreadCount > 0 && (
                            <Badge className="ml-auto bg-indigo-600 text-[10px] px-1.5 h-4 min-w-[16px] flex items-center justify-center">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </Badge>
                          )}
                          {isActive && item.title !== "Messages" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
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

      <SidebarFooter className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 mb-3 bg-slate-50 rounded-xl p-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.email}</p>
            <p className="text-[10px] text-slate-500 capitalize truncate">{label}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-left rounded-xl border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
