import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useTranslation } from "@/lib/i18n";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
    Baby, CheckCircle2, Award, MessageSquare,
    QrCode, ChevronRight, Clock, Activity,
    Bell, Copy, Check, Info, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardShell from "./DashboardShell";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

const SparkTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{payload[0].value} days attended</p>
        </div>
    );
};

const ParentDashboardNew = () => {
    const { user } = useAuth();
    const { unreadCount } = useMessages();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [copied, setCopied] = React.useState(false);
    const [showPagerInfo, setShowPagerInfo] = React.useState(false);

    // Fetch user profile for latest family sanctuary code
    const { data: userProfile } = useQuery({
        queryKey: ["current-user-profile-code", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data } = await supabase.from("profiles").select("family_code").eq("id", user.id).maybeSingle();
            return data;
        },
        enabled: !!user?.id,
    });

    const { data: myChildren = [], isLoading } = useQuery({
        queryKey: ["parent-my-children", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            try {
                const { data, error } = await supabase.rpc("get_parent_children_with_classes", {
                    parent_user_id: user.id,
                });
                if (!error && Array.isArray(data) && data.length > 0) {
                    return data.map((child: any) => ({
                        id: child.child_id || child.id,
                        first_name: child.first_name,
                        last_name: child.last_name,
                        age: child.age,
                        allergies: child.allergies,
                        points_balance: child.points_balance || 0,
                        current_class_name: child.current_class_name || 'General / Summer Camp',
                        family_code: child.family_code || child.parent_family_code,
                    }));
                }
            } catch (rpcErr) {
                console.warn("Notice in get_parent_children_with_classes RPC, attempting direct query:", rpcErr);
            }

            // Resilient direct query fallback
            try {
                const { data: directData } = await supabase
                    .from('children')
                    .select('*')
                    .eq('parent_id', user.id)
                    .order('first_name');

                if (Array.isArray(directData) && directData.length > 0) {
                    return directData.map((child: any) => ({
                        id: child.id,
                        first_name: child.first_name,
                        last_name: child.last_name,
                        age: child.age,
                        allergies: child.allergies,
                        points_balance: child.points_balance || 0,
                        current_class_name: child.current_class_name || child.class_name || 'General / Summer Camp',
                    }));
                }
            } catch (directErr) {
                console.error("Error fetching children via direct query:", directErr);
            }

            return [];
        },
        enabled: !!user?.id,
    });

    const { data: recentAttendance = [] } = useQuery({
        queryKey: ["parent-recent-attendance", user?.id, myChildren.length],
        queryFn: async () => {
            if (!user?.id || myChildren.length === 0) return [];
            const childIds = myChildren.map((c: any) => c.id);
            const { data } = await supabase
                .from("attendance")
                .select("*, children(first_name, last_name), profiles!attendance_checked_in_by_fkey(first_name, last_name)")
                .in("child_id", childIds)
                .order("attendance_date", { ascending: false })
                .limit(20);
            return data || [];
        },
        enabled: !!user?.id && myChildren.length > 0,
    });

    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, "yyyy-MM-dd");
        const checked = recentAttendance.filter((a: any) => a.attendance_date === dateStr).length;
        return { day: format(d, "EEE"), attended: checked };
    });

    const presentToday = recentAttendance.filter(
        (a: any) =>
            a.attendance_date === format(new Date(), "yyyy-MM-dd") &&
            a.checked_in_at &&
            !a.checked_out_at
    ).length;

    const totalPoints = myChildren.reduce(
        (acc: number, curr: any) => acc + (curr.points_balance || 0),
        0
    );

    const stats = [
        {
            label: "My Children",
            value: myChildren.length,
            icon: Baby,
            iconBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            trend: "Registered",
        },
        {
            label: "Present Today",
            value: presentToday,
            icon: CheckCircle2,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: "On-site now",
        },
        {
            label: "Reward Points",
            value: totalPoints,
            icon: Award,
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            trend: "Total balance",
        },
        {
            label: "Notifications",
            value: unreadCount,
            icon: MessageSquare,
            iconBg: unreadCount > 0 ? "bg-rose-500/10" : "bg-muted",
            iconColor: unreadCount > 0 ? "text-rose-500" : "text-muted-foreground",
            trend: unreadCount > 0 ? "Unread" : "All caught up",
        },
    ];

    const quickLinks = [
        { label: "Messages", icon: MessageSquare, path: "/parent/messages", badge: unreadCount },
        { label: "QR Code", icon: QrCode, path: "/parent/children" },
        { label: "Attendance", icon: CheckCircle2, path: "/parent/attendance" },
        { label: "My Children", icon: Baby, path: "/parent/children" },
    ];

    const familyCode = (user as any)?.family_code || userProfile?.family_code || myChildren.find((c: any) => c.family_code)?.family_code || "";

    const handleCopyFamilyCode = () => {
        if (familyCode) {
            navigator.clipboard.writeText(familyCode);
            setCopied(true);
            toast.success("Family Sanctuary Pager Code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <DashboardShell
            title="Family Dashboard"
            subtitle={format(new Date(), "EEEE, MMMM d")}
            action={
                <Button
                    size="sm"
                    onClick={() => navigate("/parent/messages")}
                    variant="outline"
                    className="h-8 px-2.5 sm:px-3 text-xs gap-1.5"
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline sm:inline">Messages</span>
                    {unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            }
        >
            {/* Family Sanctuary Pager Code Banner - compact horizontal bar */}
            <div className="surface-card bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-primary/10 border-rose-500/20 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 animate-enter animate-enter-1">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 truncate">
                                Sanctuary Pager Code
                            </p>
                            <button
                                onClick={() => setShowPagerInfo(true)}
                                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                title="How Sanctuary Callout Works"
                            >
                                <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </button>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1 hidden xs:block sm:block">
                            Flashes on sanctuary screen if child needs care.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="bg-card border-2 border-rose-500/30 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl shadow-xs flex items-center">
                        <span className="font-mono text-base sm:text-xl font-black tracking-widest text-foreground">
                            {familyCode || "—"}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 sm:px-3 gap-1 border-rose-500/20 hover:bg-rose-500/10 text-xs"
                        onClick={handleCopyFamilyCode}
                        title="Copy Pager Code"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline font-semibold">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
                {stats.map((stat, i) => (
                    <div key={stat.label} className={cn("kpi-card animate-enter", `animate-enter-${i + 1}`)}>
                        <div className={cn("kpi-icon", stat.iconBg)}>
                            <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="kpi-label">{stat.label}</p>
                            <p className="kpi-value">{stat.value}</p>
                            <p className="kpi-trend">{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Children strip + sparkline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5 animate-enter animate-enter-3">
                {/* Children cards */}
                <div className="surface-card lg:col-span-2 flex flex-col justify-between">
                    <div>
                        <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 border-b border-border/50 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-[13px] sm:text-[14px]">Your Children</p>
                                <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">Current status for each child</p>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => navigate("/parent/children")}
                            >
                                Manage <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                        <div className="p-2.5 sm:p-4">
                            {isLoading ? (
                                <div className="py-6 text-center text-muted-foreground text-xs sm:text-sm">Loading…</div>
                            ) : myChildren.length === 0 ? (
                                <div className="py-6 flex flex-col items-center text-muted-foreground">
                                    <Baby className="h-6 w-6 mb-2 opacity-25" />
                                    <p className="text-xs sm:text-sm font-medium">No children registered yet</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 h-8 text-xs"
                                        onClick={() => navigate("/parent/children")}
                                    >
                                        Register a child
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    {myChildren.map((child: any) => {
                                        const childAttendance = recentAttendance.filter(
                                            (a: any) =>
                                                a.child_id === child.id &&
                                                a.attendance_date === format(new Date(), "yyyy-MM-dd")
                                        );
                                        const isPresent =
                                            childAttendance.length > 0 &&
                                            childAttendance[0].checked_in_at &&
                                            !childAttendance[0].checked_out_at;
                                        const initials = `${child.first_name?.[0] ?? ""}${child.last_name?.[0] ?? ""}`.toUpperCase();

                                        return (
                                            <div
                                                key={child.id}
                                                onClick={() => navigate("/parent/children")}
                                                className="flex items-center gap-2.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-border/60 hover:border-rose-300 hover:bg-rose-500/5 transition-all cursor-pointer group"
                                            >
                                                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-rose-500">
                                                    {initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] sm:text-[13px] font-semibold leading-none truncate">
                                                        {child.first_name} {child.last_name}
                                                    </p>
                                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                                                        {child.current_class_name || `Age ${child.age}`}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border flex-shrink-0",
                                                    isPresent
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                        : "bg-muted text-muted-foreground border-border"
                                                )}>
                                                    {isPresent ? "Present" : "Away"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance sparkline */}
                <div className="surface-card flex flex-col justify-between">
                    <div>
                        <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2 sm:pb-3 border-b border-border/50">
                            <p className="font-semibold text-[13px] sm:text-[14px]">Attendance This Week</p>
                            <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">Daily check-in summary</p>
                        </div>
                        <div className="p-3 sm:p-4 h-[130px] sm:h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={attendanceTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} allowDecimals={false} />
                                    <Tooltip content={<SparkTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="attended"
                                        stroke="hsl(346,84%,58%)"
                                        strokeWidth={2.5}
                                        dot={{ fill: "hsl(346,84%,58%)", r: 3, strokeWidth: 0 }}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Week summary */}
                    <div className="px-3.5 sm:px-5 pb-3 sm:pb-5 grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-sm sm:text-lg font-bold">{attendanceTrend.reduce((s, d) => s + d.attended, 0)}</p>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">Total Days</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-sm sm:text-lg font-bold">{totalPoints}</p>
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">Points</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <div className="animate-enter animate-enter-4">
                <p className="section-label mb-2">Quick Links</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {quickLinks.map((link) => (
                        <button
                            key={link.label}
                            onClick={() => navigate(link.path)}
                            className="group relative flex flex-col items-center gap-1.5 p-2.5 sm:p-4 rounded-xl border border-border/70 bg-card hover:border-rose-300 hover:bg-rose-500/5 hover:shadow-sm transition-all duration-200"
                        >
                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/15 transition-colors">
                                <link.icon className="h-4 w-4 text-rose-500" />
                            </div>
                            <span className="text-[11px] sm:text-[12px] font-semibold text-foreground">{link.label}</span>
                            {link.badge != null && link.badge > 0 && (
                                <span className="absolute top-2 right-2 h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {link.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent attendance */}
            <div className="animate-enter animate-enter-5">
                <div className="flex items-center justify-between mb-2.5">
                    <p className="section-label">Recent Activity</p>
                    <button
                        onClick={() => navigate("/parent/attendance")}
                        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        View all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="surface-card divide-y divide-border/50">
                    {recentAttendance.length === 0 ? (
                        <div className="py-8 flex flex-col items-center text-muted-foreground">
                            <Activity className="h-7 w-7 mb-2 opacity-25" />
                            <p className="text-sm font-medium">No recent activity</p>
                        </div>
                    ) : (
                        recentAttendance.slice(0, 5).map((record: any) => {
                            const initials = `${record.children?.first_name?.[0] ?? ""}${record.children?.last_name?.[0] ?? ""}`.toUpperCase();
                            const isPresent = record.checked_in_at && !record.checked_out_at;
                            return (
                                <div key={record.id} className="feed-row">
                                    <div className="feed-avatar bg-rose-500/10 text-rose-600">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold leading-none mb-0.5">
                                            {record.children?.first_name} {record.children?.last_name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {record.checked_out_at
                                                ? `Left · ${format(new Date(record.checked_out_at), "MMM d, HH:mm")}`
                                                : record.checked_in_at
                                                    ? `Arrived · ${format(new Date(record.checked_in_at), "MMM d, HH:mm")}`
                                                    : record.attendance_date}
                                        </p>
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                        isPresent
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {isPresent ? "Present" : "Away"}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* How Sanctuary Callout Works Dialog */}
            <Dialog open={showPagerInfo} onOpenChange={setShowPagerInfo}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5 text-rose-500" />
                            Sanctuary Pager Code System
                        </DialogTitle>
                        <DialogDescription className="text-left text-sm pt-2 space-y-3">
                            <p>
                                During church services, our children's ministry team maintains a silent sanctuary paging protocol to ensure your family's safety and privacy:
                            </p>
                            <div className="bg-muted/50 p-3.5 rounded-xl space-y-2 border border-border/70 text-xs">
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-rose-500">1.</span>
                                    <span><strong>Discreet Projection:</strong> If your child is inconsolable, needs assistance, or requires medical attention, classroom leaders trigger a callout.</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-rose-500">2.</span>
                                    <span><strong>Screen Alert:</strong> Only your 4-character code (<strong className="font-mono text-rose-600">{familyCode || "CODE"}</strong>) will flash on the sanctuary projector screen (e.g. <em>PAGER # {familyCode}</em>).</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-rose-500">3.</span>
                                    <span><strong>Complete Privacy:</strong> Your child's and family's names are never announced or displayed publicly.</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Keep this code in mind or save it on your phone during worship service.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setShowPagerInfo(false)} className="w-full sm:w-auto">
                            Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
};

export default ParentDashboardNew;
