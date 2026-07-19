import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
    CheckCircle2, XCircle, ClipboardCheck, AlertTriangle,
    Clock, BookOpen, MessageSquare, QrCode, ChevronRight,
    Activity, Baby
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardShell from "./DashboardShell";

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{payload[0].value} children</p>
        </div>
    );
};

const StaffTeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: myClasses = [] } = useQuery({
        queryKey: ["staff-my-classes", user?.id],
        queryFn: async () => {
            const { data } = await supabase.from("classes").select("*").limit(10);
            return data || [];
        },
        enabled: !!user?.id,
    });

    const { data: todayAttendance = [] } = useQuery({
        queryKey: ["staff-today-attendance"],
        queryFn: async () => {
            const { data } = await supabase
                .from("attendance")
                .select("*, children(first_name, last_name, age, allergies, photo_url)")
                .gte("attendance_date", format(startOfDay(new Date()), "yyyy-MM-dd"))
                .lte("attendance_date", format(endOfDay(new Date()), "yyyy-MM-dd"))
                .order("checked_in_at", { ascending: false });
            return data || [];
        },
        refetchInterval: 20000,
    });

    const { data: messagesCount = 0 } = useQuery({
        queryKey: ["staff-messages-unread-count", user?.id],
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

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const allergyAlerts = todayAttendance.filter((a: any) => a.children?.allergies && !a.checked_out_at).length;

    const hourlyData = Array.from({ length: 10 }, (_, i) => {
        const hour = i + 7;
        const count = todayAttendance.filter((a: any) => {
            if (!a.checked_in_at) return false;
            return new Date(a.checked_in_at).getHours() === hour;
        }).length;
        return { hour: `${hour}:00`, count };
    });

    const stats = [
        {
            label: "Present Now",
            value: presentNow,
            icon: CheckCircle2,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: "On-site",
        },
        {
            label: "Checked Out",
            value: checkedOut,
            icon: XCircle,
            iconBg: "bg-slate-500/10",
            iconColor: "text-slate-400",
            trend: "Departed today",
        },
        {
            label: "Total Entries",
            value: todayAttendance.length,
            icon: ClipboardCheck,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "All check-ins",
        },
        {
            label: "Health Alerts",
            value: allergyAlerts,
            icon: AlertTriangle,
            iconBg: allergyAlerts > 0 ? "bg-amber-500/10" : "bg-muted",
            iconColor: allergyAlerts > 0 ? "text-amber-500" : "text-muted-foreground",
            trend: allergyAlerts > 0 ? "Active now" : "All clear",
        },
    ];

    return (
        <DashboardShell
            title="Staff Overview"
            subtitle={`${format(new Date(), "EEEE, MMMM d")} · Signed in as ${user?.email}`}
            action={
                <Button size="sm" onClick={() => navigate("/messages")} className="gap-2" variant="outline">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Inbox
                    {messagesCount > 0 && (
                        <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                            {messagesCount}
                        </span>
                    )}
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

            {/* Charts + Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-enter animate-enter-3">
                {/* Bar chart - arrival flow */}
                <div className="surface-card lg:col-span-2">
                    <div className="px-5 pt-5 pb-3 border-b border-border/50">
                        <p className="font-semibold text-[14px]">Arrival Flow</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Children checked in by hour</p>
                    </div>
                    <div className="p-5 h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={18}>
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} allowDecimals={false} />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                                    {hourlyData.map((_, i) => (
                                        <Cell key={i} fill={`hsl(152,69%,${Math.max(42, 62 - i * 2)}%)`} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Classes panel */}
                <div className="surface-card">
                    <div className="px-5 pt-5 pb-3 border-b border-border/50">
                        <p className="font-semibold text-[14px]">Assigned Classes</p>
                    </div>
                    <div className="divide-y divide-border/50 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {myClasses.length === 0 ? (
                            <div className="py-12 flex flex-col items-center text-muted-foreground">
                                <BookOpen className="h-6 w-6 mb-2 opacity-25" />
                                <p className="text-[12px] font-medium">No active classes</p>
                            </div>
                        ) : (
                            myClasses.map((cls: any) => (
                                <button
                                    key={cls.id}
                                    onClick={() => navigate("/classes")}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold leading-none">{cls.name}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{cls.room || "No room"}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Live feed */}
            <div className="animate-enter animate-enter-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Real-time Feed</p>
                    <button
                        onClick={() => navigate("/attendance")}
                        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        Full logs <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="surface-card divide-y divide-border/50 max-h-[420px] overflow-y-auto custom-scrollbar">
                    {todayAttendance.length === 0 ? (
                        <div className="py-14 flex flex-col items-center text-muted-foreground">
                            <Activity className="h-7 w-7 mb-2 opacity-25" />
                            <p className="text-sm font-medium">Waiting for check-ins…</p>
                        </div>
                    ) : (
                        todayAttendance.map((record: any) => {
                            const initials = `${record.children?.first_name?.[0] ?? ""}${record.children?.last_name?.[0] ?? ""}`.toUpperCase();
                            const isPresent = record.checked_in_at && !record.checked_out_at;
                            return (
                                <div key={record.id} className="feed-row">
                                    <div className="feed-avatar">
                                        {record.children?.photo_url ? (
                                            <img src={record.children.photo_url} className="h-full w-full object-cover" alt="" />
                                        ) : initials || <Baby className="h-4 w-4 opacity-40" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold leading-none mb-0.5">
                                            {record.children?.first_name} {record.children?.last_name}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {record.checked_out_at
                                                    ? `Left ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                    : record.checked_in_at
                                                        ? `Arrived ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                        : "—"}
                                            </p>
                                            {record.children?.allergies && (
                                                <span className="badge-warning">Health alert</span>
                                            )}
                                        </div>
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

export default StaffTeacherDashboard;
