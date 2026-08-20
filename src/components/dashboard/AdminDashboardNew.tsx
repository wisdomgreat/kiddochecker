import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    Monitor, BarChart3, Settings, QrCode, Printer, LogOut, MailCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useSettings } from "@/hooks/useSettings";
import DashboardShell from "./DashboardShell";

const DONUT_COLORS = ["hsl(230,75%,55%)", "hsl(220,14%,89%)"];

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

    const { data: weeklyAttendance = [] } = useQuery({
        queryKey: ["dashboard-weekly-attendance-v4"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("attendance")
                .select("id, attendance_date, checked_in_at, created_at")
                .order("attendance_date", { ascending: false })
                .limit(500);

            if (error) {
                console.error("Weekly attendance fetch error:", error);
            }

            const daysMap: Record<string, number> = {};
            const daysOrder: { dayStr: string; dayName: string }[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dayStr = format(d, "yyyy-MM-dd");
                const dayName = format(d, "EEE");
                daysMap[dayStr] = 0;
                daysOrder.push({ dayStr, dayName });
            }

            if (data && data.length > 0) {
                data.forEach((rec: any) => {
                    let dateStr = rec.attendance_date;
                    if (dateStr && typeof dateStr === "string") {
                        dateStr = dateStr.split("T")[0];
                    } else if (rec.checked_in_at) {
                        dateStr = String(rec.checked_in_at).split("T")[0];
                    }

                    if (dateStr && daysMap[dateStr] !== undefined) {
                        daysMap[dateStr] += 1;
                    }
                });
            }

            return daysOrder.map(({ dayStr, dayName }) => ({ 
                day: dayName, 
                dayStr,
                checkins: daysMap[dayStr] || 0 
            }));
        },
        refetchInterval: 15000,
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

    const quickActions = [
        { title: "Kiosk", icon: QrCode, path: "/check-in" },
        { title: "QR Labels", icon: Printer, path: "/qr-management" },
        { title: "Email Logs", icon: MailCheck, path: "/admin/email-logs" },
        { title: "Schedules", icon: Calendar, path: "/staff/schedules" },
        { title: "Users", icon: Users, path: "/users" },
        { title: "Devices", icon: Monitor, path: "/devices" },
        { title: "Reports", icon: BarChart3, path: "/reports" },
        { title: "Settings", icon: Settings, path: "/settings" },
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
                <Button size="sm" onClick={() => navigate("/check-in")} className="gap-2">
                    <QrCode className="h-3.5 w-3.5" />
                    Launch Kiosk
                </Button>
            }
        >
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={stat.label} className={cn("kpi-card animate-enter", `animate-enter-${i + 1}`)}>
                        <div className={cn("kpi-icon", stat.iconBg)}>
                            <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-enter animate-enter-3">
                {/* Attendance Trend card */}
                <div className="surface-card lg:col-span-2 flex flex-col justify-between">
                    <div className="px-5 pt-5 pb-3 border-b border-border/50 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-[14px]">Attendance Trend</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">Check-ins over the last 7 days</p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-bold">
                            {chartData.find(d => d.day === todayDayName)?.checkins || 0} recorded today
                        </Badge>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between min-h-[220px]">
                        <div className="grid grid-cols-7 gap-2 items-end h-[160px] pt-4">
                            {chartData.map((d) => {
                                const isToday = d.day === todayDayName;
                                return (
                                    <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                                        <span className={cn(
                                            "text-[11px] font-bold px-1.5 py-0.5 rounded transition-all",
                                            d.checkins > 0
                                                ? (isToday ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border text-foreground")
                                                : "text-muted-foreground/40"
                                        )}>
                                            {d.checkins}
                                        </span>
                                        <div className="w-full max-w-[38px] bg-muted/40 rounded-t-lg h-full max-h-[110px] flex items-end p-0.5 overflow-hidden">
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
                                            "text-[11px] font-semibold tracking-tight",
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
                    <div className="px-5 pt-5 pb-3 border-b border-border/50">
                        <p className="font-semibold text-[14px]">On-site Status</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Current snapshot</p>
                    </div>
                    <div className="p-5">
                        <div className="h-[160px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={52} outerRadius={68}
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
                                <p className="text-2xl font-bold">{presentNow}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Present</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="bg-muted/50 rounded-lg p-3 text-center">
                                    <div className="h-1.5 w-6 rounded-full mx-auto mb-2" style={{ background: DONUT_COLORS[i] }} />
                                    <p className="text-lg font-bold">{item.value}</p>
                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="animate-enter animate-enter-4">
                <p className="section-label mb-3">Quick Actions</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {quickActions.map((action) => (
                        <button
                            key={action.title}
                            onClick={() => navigate(action.path)}
                            className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border/70 bg-card hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all duration-200"
                        >
                            <div className="h-9 w-9 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{action.title}</span>
                        </button>
                    ))}
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
                        <div className="py-14 flex flex-col items-center text-muted-foreground">
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
                            return (
                                <div key={record.id} className="feed-row">
                                    <div className="feed-avatar">
                                        {childObj.photo_url ? (
                                            <img src={childObj.photo_url} className="h-full w-full object-cover" alt="" />
                                        ) : (
                                            initials || <Baby className="h-4 w-4 opacity-40" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold leading-none mb-0.5">
                                            {fullName}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {record.checked_out_at
                                                ? `Left at ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                : record.checked_in_at
                                                    ? `Arrived at ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                    : "—"}
                                        </p>
                                    </div>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                        isPresent
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {isPresent ? "Present" : "Left"}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardShell>
    );
};

export default AdminDashboardNew;
