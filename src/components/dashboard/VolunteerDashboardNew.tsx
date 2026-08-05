import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import {
    QrCode, Clock, ChevronRight,
    LogIn, LogOut, AlertTriangle, MessageSquare, Users, Baby
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardShell from "./DashboardShell";

const VolunteerDashboardNew = () => {
    const { unreadCount } = useMessages();
    const navigate = useNavigate();

    const { data: todayAttendance = [] } = useQuery({
        queryKey: ["volunteer-attendance-today"],
        queryFn: async () => {
            const { data } = await supabase
                .from("attendance")
                .select("*, children(first_name, last_name, allergies)")
                .gte("attendance_date", format(startOfDay(new Date()), "yyyy-MM-dd"))
                .lte("attendance_date", format(endOfDay(new Date()), "yyyy-MM-dd"))
                .order("checked_in_at", { ascending: false });
            return data || [];
        },
        refetchInterval: 15000,
    });

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const allergyAlerts = todayAttendance.filter((a: any) => a.children?.allergies && !a.checked_out_at);

    return (
        <DashboardShell
            title="Volunteer Station"
            subtitle={format(new Date(), "EEEE, MMMM d")}
            className="max-w-2xl"
        >
            {/* KPI pills row */}
            <div className="grid grid-cols-3 gap-3 animate-enter animate-enter-1">
                {[
                    { label: "On-site", value: presentNow, color: "bg-amber-500/10 text-amber-600", dot: "bg-amber-500" },
                    { label: "Total", value: todayAttendance.length, color: "bg-muted text-foreground", dot: "bg-muted-foreground/40" },
                    { label: "Departed", value: checkedOut, color: "bg-muted text-foreground", dot: "bg-muted-foreground/40" },
                ].map((stat) => (
                    <div key={stat.label} className="surface-card p-4 flex flex-col items-center gap-1.5">
                        <div className={cn("h-1.5 w-5 rounded-full", stat.dot)} />
                        <p className={cn("text-2xl font-bold", stat.color.split(" ")[1])}>{stat.value}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Primary CTA */}
            <button
                onClick={() => navigate("/check-in")}
                className="w-full group flex items-center justify-between p-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 shadow-md hover:shadow-lg animate-enter animate-enter-2"
            >
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <QrCode className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-[16px] leading-none">Check-In Session</p>
                        <p className="text-[12px] text-amber-100 mt-1">Launch scanning terminal</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3 animate-enter animate-enter-3">
                <button
                    onClick={() => navigate("/check-out")}
                    className="group surface-card flex items-center gap-3 p-4 hover:border-border transition-all"
                >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors flex-shrink-0">
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                        <p className="text-[13px] font-semibold leading-none">Departure</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Process exits</p>
                    </div>
                </button>
                <button
                    onClick={() => navigate("/messages")}
                    className="group surface-card flex items-center gap-3 p-4 hover:border-border transition-all relative"
                >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors flex-shrink-0 relative">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 min-w-[14px] px-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-left">
                        <p className="text-[13px] font-semibold leading-none">Messages</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Staff channel</p>
                    </div>
                </button>
            </div>

            {/* Medical alerts */}
            {allergyAlerts.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-5 animate-enter animate-enter-4">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Medical Alerts — {allergyAlerts.length} active
                        </p>
                    </div>
                    <div className="space-y-2">
                        {allergyAlerts.map((record: any) => (
                            <div key={record.id} className="flex items-center justify-between bg-white dark:bg-amber-900/20 rounded-lg px-4 py-3 border border-amber-200/60 dark:border-amber-700/30">
                                <div>
                                    <p className="text-[13px] font-semibold">
                                        {record.children?.first_name} {record.children?.last_name}
                                    </p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                                        {record.children?.allergies}
                                    </p>
                                </div>
                                <span className="badge-warning">Active</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Session log */}
            <div className="animate-enter animate-enter-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Session Log</p>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Realtime
                    </span>
                </div>
                <div className="surface-card divide-y divide-border/50 max-h-80 overflow-y-auto custom-scrollbar">
                    {todayAttendance.length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-muted-foreground">
                            <Clock className="h-6 w-6 mb-2 opacity-25" />
                            <p className="text-[12px] font-semibold uppercase tracking-wider">Waiting for traffic…</p>
                        </div>
                    ) : (
                        todayAttendance.slice(0, 15).map((record: any) => {
                            const initials = `${record.children?.first_name?.[0] ?? ""}${record.children?.last_name?.[0] ?? ""}`.toUpperCase();
                            const isPresent = record.checked_in_at && !record.checked_out_at;
                            return (
                                <div key={record.id} className="feed-row">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold",
                                        isPresent ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isPresent
                                            ? <LogIn className="h-3.5 w-3.5" />
                                            : <LogOut className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold leading-none mb-0.5 truncate">
                                            {record.children?.first_name} {record.children?.last_name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-medium">
                                            {record.checked_out_at
                                                ? `Departed ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                : record.checked_in_at
                                                    ? `Arrived ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                    : "—"}
                                        </p>
                                    </div>
                                    {record.children?.allergies && !record.checked_out_at && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardShell>
    );
};

export default VolunteerDashboardNew;
