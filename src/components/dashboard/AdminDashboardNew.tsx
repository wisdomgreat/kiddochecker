import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import {
    Users, Baby, Calendar, Shield, MessageSquare,
    TrendingUp, Clock, Activity, UserCheck, ChevronRight,
    Monitor, BarChart3, Settings, QrCode, Printer, LogOut, MailCheck, Send, CheckCircle2,
    Bell, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useSettings } from "@/hooks/useSettings";
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

const DONUT_COLORS = ["hsl(230,75%,55%)", "hsl(220,14%,89%)"];

const PAGE_REASONS = [
    "Child needs comfort / inconsolable",
    "Diaper / Restroom assistance",
    "Health / Medical / Allergy attention",
    "Early pickup / Service dismissal"
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{payload[0].value} check-ins</p>
        </div>
    );
};

const AdminDashboardNew = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const [pageDialogItem, setPageDialogItem] = React.useState<any>(null);
    const [pageReason, setPageReason] = React.useState<string>("Child needs comfort / inconsolable");
    const [isPaging, setIsPaging] = React.useState(false);
    const [copiedPager, setCopiedPager] = React.useState(false);

    const handleTriggerSanctuaryPage = async () => {
        if (!pageDialogItem?.family_code) {
            toast.error("No family sanctuary code found for this child.");
            return;
        }
        setIsPaging(true);
        try {
            await apiFetch('/api/sanctuary/page', {
                method: 'POST',
                body: JSON.stringify({
                    family_code: pageDialogItem.family_code,
                    child_id: pageDialogItem.child_id,
                    child_name: pageDialogItem.child_name,
                    reason: pageReason
                })
            });
            toast.success(`Sanctuary Callout triggered for Family ${pageDialogItem.family_code}! Alert logged.`);
            setPageDialogItem(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger sanctuary callout");
        } finally {
            setIsPaging(false);
        }
    };

    const { data: children = [] } = useQuery({
        queryKey: ["dashboard-children"],
        queryFn: async () => {
            const { data } = await supabase.from("children").select("*");
            return data || [];
        },
    });

    const { data: staff = [] } = useQuery({
        queryKey: ["dashboard-staff"],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_staff_members");
            if (error) return [];
            return data || [];
        },
    });

    const { data: attendance = [] } = useQuery({
        queryKey: ["dashboard-attendance-today"],
        queryFn: async () => {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const startStr = format(startOfDay(new Date()), "yyyy-MM-dd'T'00:00:00");
            const { data } = await supabase
                .from("attendance")
                .select("*, children(*), child:children(*)")
                .or(`attendance_date.eq.${todayStr},checked_in_at.gte.${startStr}`)
                .order("checked_in_at", { ascending: false });
            return data || [];
        },
        refetchInterval: 15000,
    });

    // Direct API call to bypass bridgeProxy ordering/limit restrictions for 7-day chart
    const { data: weeklyAttendance = [] } = useQuery({
        queryKey: ["dashboard-weekly-attendance-v6"],
        queryFn: async () => {
            // Build 7-day window
            const daysMap: Record<string, number> = {};
            const daysOrder: { dayStr: string; dayName: string }[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dayStr = format(d, "yyyy-MM-dd");
                const dayName = format(d, "EEE");
                daysMap[dayStr] = 0;
                daysOrder.push({ dayStr, dayName });
            }

            try {
                // Direct API call — unaffected by bridge proxy chaining issues
                const res = await apiFetch('/api/query', {
                    method: 'POST',
                    body: JSON.stringify({
                        table: 'attendance',
                        select: 'id, attendance_date, checked_in_at',
                        filters: []
                    })
                });

                const rows = Array.isArray(res?.data) ? res.data : [];
                rows.forEach((rec: any) => {
                    let dateStr = rec.attendance_date;
                    if (dateStr && typeof dateStr === "string") {
                        dateStr = dateStr.split("T")[0];
                    } else if (rec.checked_in_at) {
                        dateStr = String(rec.checked_in_at).split("T")[0];
                    } else if (rec.created_at) {
                        dateStr = String(rec.created_at).split("T")[0];
                    }
                    if (dateStr && daysMap[dateStr] !== undefined) {
                        daysMap[dateStr] += 1;
                    }
                });
            } catch (e) {
                console.error("[Dashboard] Weekly attendance fetch error:", e);
            }

            return daysOrder.map(({ dayStr, dayName }) => ({
                day: dayName,
                dayStr,
                checkins: daysMap[dayStr] || 0
            }));
        },
        refetchInterval: 30000,
    });

    const { data: messagesCount = 0 } = useQuery({
        queryKey: ["dashboard-unread-messages-count", user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("recipient_id", user.id)
                .eq("is_read", false);
            return count || 0;
        },
        enabled: !!user?.id,
    });

    const presentNow = attendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const totalCheckins = attendance.length;

    const pieData = [
        { name: "Present", value: presentNow },
        { name: "Away", value: Math.max(0, children.length - presentNow) },
    ];

    const stats = [
        {
            label: "Enrolled Children",
            value: children.length,
            icon: Baby,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "Full registry",
        },
        {
            label: "Present Today",
            value: presentNow,
            icon: UserCheck,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: `of ${totalCheckins} check-ins`,
        },
        {
            label: "Duty Staff",
            value: staff.length,
            icon: Shield,
            iconBg: "bg-slate-500/10",
            iconColor: "text-slate-500",
            trend: "All cleared",
        },
        {
            label: "Unread Messages",
            value: messagesCount,
            icon: MessageSquare,
            iconBg: messagesCount > 0 ? "bg-amber-500/10" : "bg-muted",
            iconColor: messagesCount > 0 ? "text-amber-500" : "text-muted-foreground",
            trend: messagesCount > 0 ? "Action required" : "All clear",
        },
    ];

    const queryClient = useQueryClient();

    // Test Email Mutation — broadcasts a sample family fast-pass email from dashboard
    const sendTestEmailMutation = useMutation({
        mutationFn: async () => {
            return await apiFetch('/api/emails/broadcast-summer-camp', {
                method: 'POST',
                body: JSON.stringify({
                    churchName: 'Green Valley Alliance',
                    rateLimitMs: 0
                })
            });
        },
        onSuccess: (data: any) => {
            if (data?.error) {
                toast.warning('Email Service Unavailable', {
                    description: 'Azure Communication Services is not configured. Email delivery log will still record the attempt.'
                });
            } else {
                toast.success('Email Broadcast Initiated!', {
                    description: `Fast-Pass PIN emails queued for ${data?.familiesCount || 'all'} families. Check Email Delivery Logs for status.`
                });
            }
            queryClient.invalidateQueries({ queryKey: ['email-logs'] });
            queryClient.invalidateQueries({ queryKey: ['email-stats'] });
        },
        onError: (err: any) => {
            toast.error('Broadcast Failed', { description: err.message });
        }
    });

    const quickActions = [
        { title: "Kiosk", icon: QrCode, path: "/check-in" },
        { title: "Security", icon: Shield, path: "/admin/security" },
        { title: "QR Labels", icon: Printer, path: "/qr-management" },
        { title: "Email Logs", icon: MailCheck, path: "/admin/email-logs" },
        { title: "Schedules", icon: Calendar, path: "/staff/schedules" },
        { title: "Users", icon: Users, path: "/users" },
        { title: "Devices", icon: Monitor, path: "/devices" },
        { title: "Reports", icon: BarChart3, path: "/reports" },
    ];

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const chartData = React.useMemo(() => {
        const daysMap: Record<string, number> = {};
        const daysOrder: { dayStr: string; dayName: string }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = subDays(new Date(), i);
            const dayStr = format(d, "yyyy-MM-dd");
            const dayName = format(d, "EEE");
            daysMap[dayStr] = 0;
            daysOrder.push({ dayStr, dayName });
        }

        if (weeklyAttendance && weeklyAttendance.length > 0) {
            weeklyAttendance.forEach((item: any) => {
                if (item.dayStr && daysMap[item.dayStr] !== undefined) {
                    daysMap[item.dayStr] = item.checkins;
                }
            });
        }

        // Ensure today's total is at least the live fetched count
        if (attendance.length > (daysMap[todayStr] || 0)) {
            daysMap[todayStr] = attendance.length;
        }

        const maxVal = Math.max(1, ...Object.values(daysMap));

        return daysOrder.map(({ dayStr, dayName }) => ({
            day: dayName,
            dayStr,
            checkins: daysMap[dayStr] || 0,
            heightPct: Math.round(((daysMap[dayStr] || 0) / maxVal) * 100)
        }));
    }, [weeklyAttendance, attendance, todayStr]);

    return (
        <DashboardShell
            title="Admin Dashboard"
            subtitle={`${format(new Date(), "EEEE, MMMM d")} · ${totalCheckins} check-ins recorded`}
            action={
                <Button size="sm" onClick={() => navigate("/check-in")} className="h-8 px-2.5 sm:px-3 text-xs gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline sm:inline">Launch Kiosk</span>
                </Button>
            }
        >
            {/* KPI row - 2x2 grid on mobile */}
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

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5 animate-enter animate-enter-3">
                {/* Attendance Trend card */}
                <div className="surface-card lg:col-span-2 flex flex-col justify-between">
                    <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2 sm:pb-3 border-b border-border/50 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-[13px] sm:text-[14px]">Attendance Trend</p>
                            <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">Check-ins over the last 7 days</p>
                        </div>
                        <Badge variant="outline" className="text-[11px] sm:text-xs bg-primary/10 text-primary border-primary/20 font-bold px-1.5 sm:px-2.5">
                            {chartData.find(d => d.dayStr === todayStr)?.checkins || 0} today
                        </Badge>
                    </div>
                    <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between min-h-[170px] sm:min-h-[220px]">
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-end h-[130px] sm:h-[160px] pt-2 sm:pt-4">
                            {chartData.map((d) => {
                                const isToday = d.dayStr === todayStr;
                                return (
                                    <div key={d.dayStr} className="flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group">
                                        <span className={cn(
                                            "text-[10px] sm:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded transition-all",
                                            d.checkins > 0
                                                ? (isToday ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border text-foreground")
                                                : "text-muted-foreground/40"
                                        )}>
                                            {d.checkins}
                                        </span>
                                        <div className="w-full max-w-[34px] sm:max-w-[38px] bg-muted/40 rounded-t-lg h-full max-h-[90px] sm:max-h-[110px] flex items-end p-0.5 overflow-hidden">
                                            <div
                                                style={{ height: `${Math.max(d.checkins > 0 ? 15 : 6, d.heightPct)}%` }}
                                                className={cn(
                                                    "w-full rounded-t-md transition-all duration-500",
                                                    isToday
                                                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-md"
                                                        : (d.checkins > 0 ? "bg-gradient-to-t from-slate-600 to-slate-400" : "bg-muted-foreground/20")
                                                )}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-[10px] sm:text-[11px] font-semibold tracking-tight",
                                            isToday ? "text-primary font-bold" : "text-muted-foreground"
                                        )}>
                                            {d.day}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Donut chart */}
                <div className="surface-card">
                    <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-2 sm:pb-3 border-b border-border/50">
                        <p className="font-semibold text-[13px] sm:text-[14px]">On-site Status</p>
                        <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5">Current snapshot</p>
                    </div>
                    <div className="p-3 sm:p-5">
                        <div className="h-[130px] sm:h-[160px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={46} outerRadius={62}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={DONUT_COLORS[i]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-xl sm:text-2xl font-bold">{presentNow}</p>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Present</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-4">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
                                    <div className="h-1.5 w-5 sm:w-6 rounded-full mx-auto mb-1.5" style={{ background: DONUT_COLORS[i] }} />
                                    <p className="text-base sm:text-lg font-bold">{item.value}</p>
                                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="animate-enter animate-enter-4">
                <p className="section-label mb-2 sm:mb-3">Quick Actions</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                    {quickActions.map((action) => (
                        <button
                            key={action.title}
                            onClick={() => navigate(action.path)}
                            className="group flex flex-col items-center gap-1.5 sm:gap-2.5 p-2.5 sm:p-4 rounded-xl border border-border/70 bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all duration-200"
                        >
                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight truncate w-full">{action.title}</span>
                        </button>
                    ))}
                    {/* Test Email button */}
                    <button
                        onClick={() => sendTestEmailMutation.mutate()}
                        disabled={sendTestEmailMutation.isPending}
                        className="group flex flex-col items-center gap-1.5 sm:gap-2.5 p-2.5 sm:p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 hover:border-emerald-400/50 hover:bg-emerald-50 hover:shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                            {sendTestEmailMutation.isPending
                                ? <div className="h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                : <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                            }
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 text-center leading-tight truncate w-full">
                            {sendTestEmailMutation.isPending ? 'Sending…' : 'Send Emails'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Recent check-ins */}
            <div className="animate-enter animate-enter-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Recent Check-ins</p>
                    <button
                        onClick={() => navigate("/attendance")}
                        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        View all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="surface-card divide-y divide-border/50">
                    {attendance.length === 0 ? (
                        <div className="py-8 sm:py-10 flex flex-col items-center text-muted-foreground">
                            <Activity className="h-7 w-7 mb-2 opacity-25" />
                            <p className="text-sm font-medium">No activity today</p>
                            <p className="text-[12px] mt-0.5">Check-ins will appear here in real time</p>
                        </div>
                    ) : (
                        attendance.slice(0, 8).map((record: any) => {
                            const childObj = Array.isArray(record.children) ? record.children[0] : (record.children || record.child || {});
                            const firstName = childObj.first_name || record.child_first_name || record.child_name || "Child";
                            const lastName = childObj.last_name || record.child_last_name || "";
                            const fullName = `${firstName} ${lastName}`.trim();
                            const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
                            const isPresent = record.checked_in_at && !record.checked_out_at;
                            const famCode = childObj.family_code || record.family_code;
                            return (
                                <div key={record.id} className="feed-row justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="feed-avatar">
                                            {childObj.photo_url ? (
                                                <img src={childObj.photo_url} className="h-full w-full object-cover" alt="" />
                                            ) : (
                                                initials || <Baby className="h-4 w-4 opacity-40" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-[13px] font-semibold leading-none">
                                                    {fullName}
                                                </p>
                                                {famCode && (
                                                    <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 tracking-wider">
                                                        #{famCode}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {record.checked_out_at
                                                    ? `Left at ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                    : record.checked_in_at
                                                        ? `Arrived at ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                        : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                            isPresent
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {isPresent ? "Present" : "Left"}
                                        </span>
                                        {isPresent && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs border-primary/25 hover:bg-primary/10 text-primary gap-1 rounded-lg"
                                                title="Page Family to Sanctuary"
                                                onClick={() => {
                                                    setPageDialogItem({
                                                        child_id: childObj.id || record.child_id,
                                                        child_name: fullName,
                                                        family_code: famCode,
                                                        parent_name: childObj.parent_name,
                                                        parent_phone: childObj.parent_phone
                                                    });
                                                    setCopiedPager(false);
                                                }}
                                            >
                                                <Bell className="h-3 w-3" />
                                                <span className="hidden sm:inline">Page</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Sanctuary Callout Dialog */}
            <Dialog open={!!pageDialogItem} onOpenChange={(open) => !open && setPageDialogItem(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-primary">
                            <Bell className="h-5 w-5" />
                            Sanctuary Callout / Parent Pager
                        </DialogTitle>
                        <DialogDescription className="text-left text-sm pt-1">
                            Flash family pager code onto church sanctuary projector screen to alert parent.
                        </DialogDescription>
                    </DialogHeader>

                    {/* High-visibility Projector Card */}
                    <div className="bg-slate-950 text-white rounded-2xl p-5 text-center shadow-lg border border-slate-800 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sanctuary Screen Projection</p>
                        <div className="font-mono text-4xl font-black tracking-widest text-amber-400 py-1">
                            {pageDialogItem?.family_code || "CODE"}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Displayed on projector as: <strong className="text-white">PAGER # {pageDialogItem?.family_code || "CODE"}</strong>
                        </p>
                    </div>

                    {/* Family Details */}
                    <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1.5 border border-border/70">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground font-medium">Child:</span>
                            <span className="font-semibold">{pageDialogItem?.child_name}</span>
                        </div>
                        {pageDialogItem?.parent_name && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Parent:</span>
                                <span className="font-semibold">{pageDialogItem.parent_name}</span>
                            </div>
                        )}
                        {pageDialogItem?.parent_phone && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Phone:</span>
                                <span className="font-semibold">{pageDialogItem.parent_phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Callout Reason */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Callout Reason</label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {PAGE_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    type="button"
                                    onClick={() => setPageReason(reason)}
                                    className={cn(
                                        "text-left text-xs px-3 py-2 rounded-lg border transition-all",
                                        pageReason === reason
                                            ? "bg-primary/10 border-primary/40 font-semibold text-primary"
                                            : "border-border hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-xs gap-1.5"
                            onClick={() => {
                                navigator.clipboard.writeText(`PAGER # ${pageDialogItem?.family_code}`);
                                setCopiedPager(true);
                                toast.success(`Copied "PAGER # ${pageDialogItem?.family_code}" for ProPresenter!`);
                                setTimeout(() => setCopiedPager(false), 2000);
                            }}
                        >
                            {copiedPager ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedPager ? "Copied" : "Copy Projector Text"}
                        </Button>
                        <Button
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                            disabled={isPaging}
                            onClick={handleTriggerSanctuaryPage}
                        >
                            {isPaging ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                            Trigger Sanctuary Alert
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
};

export default AdminDashboardNew;
