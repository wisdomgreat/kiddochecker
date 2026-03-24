import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation, translations } from "@/lib/i18n";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { cn } from '@/lib/utils';
import { 
    Users, 
    Baby, 
    Calendar, 
    Shield, 
    MessageSquare, 
    TrendingUp, 
    TrendingDown,
    ArrowUpRight, 
    ArrowDownRight, 
    Clock, 
    Activity, 
    UserCheck,
    ChevronRight,
    MapPin,
    GraduationCap,
    HeartPulse,
    LayoutDashboard,
    QrCode,
    Printer,
    Monitor,
    Globe,
    BarChart3,
    Settings,
    ClipboardCheck,
    LogOut,
    LogIn,
    Bell,
    Star,
    Award,
    Sparkles,
    Zap,
    Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay, endOfDay, isToday } from "date-fns";
import { useSettings } from "@/hooks/useSettings";

const COLORS = {
    primary: "#6366f1",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    purple: "#8b5cf6",
    pink: "#ec4899",
    orange: "#f97316",
};

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" }
    })
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    change?: string;
    changeType?: "up" | "down" | "neutral";
    subtitle?: string;
    index: number;
    onClick?: () => void;
}

const StatCard = ({ title, value, icon: Icon, gradient, change, changeType, subtitle, index, onClick }: StatCardProps) => (
    <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="h-full cursor-pointer group"
        onClick={onClick}
    >
        <Card className={cn(
            "floating-island relative p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden group flex flex-col justify-between h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-700",
            gradient === 'vcard-accent-primary' ? 'hover:ring-2 hover:ring-indigo-500/20' :
            gradient === 'vcard-accent-success' ? 'hover:ring-2 hover:ring-emerald-500/20' :
            gradient === 'vcard-accent-info' ? 'hover:ring-2 hover:ring-blue-500/20' :
            'hover:ring-2 hover:ring-amber-500/20'
        )}>
            <div className="flex items-center justify-between mb-8">
                <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg group-hover:rotate-6 group-hover:scale-110", 
                    gradient === 'vcard-accent-primary' ? 'bg-indigo-600' :
                    gradient === 'vcard-accent-success' ? 'bg-emerald-500' :
                    gradient === 'vcard-accent-info' ? 'bg-blue-500' :
                    'bg-amber-500'
                )}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
                {change && (
                    <Badge className={cn(
                        "font-bold text-[10px] tracking-tight px-4 h-8 rounded-full border-none",
                        changeType === "up" ? "bg-emerald-500/10 text-emerald-500" :
                        changeType === "down" ? "bg-rose-500/10 text-rose-500" : "bg-slate-100 text-slate-500"
                    )}>
                        {changeType === "up" && <TrendingUp className="w-3 h-3 mr-1.5" />}
                        {changeType === "down" && <TrendingDown className="w-3 h-3 mr-1.5" />}
                        {change}
                    </Badge>
                )}
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-none group-hover:scale-105 origin-left transition-transform duration-500">{value}</h3>
                {subtitle && <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-3 opacity-80">{subtitle}</p>}
            </div>
            
            <div className={cn(
                "absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-all duration-1000",
                gradient === 'vcard-accent-primary' ? 'bg-indigo-600' :
                gradient === 'vcard-accent-success' ? 'bg-emerald-500' :
                gradient === 'vcard-accent-info' ? 'bg-blue-500' : 'bg-amber-500'
            )} />
        </Card>
    </motion.div>
);

const ActionCard = ({ title, description, icon: Icon, color, onClick, index }: any) => (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="show" className="h-full">
        <Card 
            onClick={onClick}
            className={cn(
                "floating-island relative p-10 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden group flex flex-col items-center text-center justify-center h-full bg-slate-900 border-none transition-all duration-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            )}
        >
            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 shadow-2xl relative z-10", color)}>
                <Icon className={cn("w-10 h-10 text-white")} />
            </div>
            <h4 className="text-xl font-bold text-white mb-2 tracking-tight relative z-10">{title}</h4>
            <p className="text-xs font-medium text-slate-300 leading-relaxed relative z-10 opacity-90 max-w-[200px]">{description}</p>
            
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-1000 bg-indigo-500/20")} />
        </Card>
    </motion.div>
);

const AdminDashboardNew = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const today = format(new Date(), "EEEE, MMMM dd, yyyy");

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
            const { data, error } = await supabase.rpc('get_staff_members');
            if (error) {
                console.error("Error fetching staff for dashboard:", error);
                return [];
            }
            return data || [];
        },
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["dashboard-classes"],
        queryFn: async () => {
            const { data } = await supabase.from("classes").select("*");
            return data || [];
        },
    });

    const { data: attendance = [] } = useQuery({
        queryKey: ["dashboard-attendance-today"],
        queryFn: async () => {
            const { data } = await supabase
                .from("attendance")
                .select("*, children(first_name, last_name, age, photo_url)")
                .gte("attendance_date", format(startOfDay(new Date()), "yyyy-MM-dd"))
                .lte("attendance_date", format(endOfDay(new Date()), "yyyy-MM-dd"))
                .order("checked_in_at", { ascending: false });
            return data || [];
        },
        refetchInterval: 30000,
    });

    const { data: weeklyAttendance = [] } = useQuery({
        queryKey: ["dashboard-weekly-attendance"],
        queryFn: async () => {
            const days: any[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dateStr = format(d, "yyyy-MM-dd");
                const { count } = await supabase
                    .from("attendance")
                    .select("*", { count: "exact", head: true })
                    .eq("attendance_date", dateStr);
                days.push({ day: format(d, "EEE"), checkins: count || 0, date: dateStr });
            }
            return days;
        },
    });

    const { data: messages = [] } = useQuery({
        queryKey: ["dashboard-unread-messages", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("recipient_id", user.id)
                .eq("is_read", false);
            return data || [];
        },
        enabled: !!user?.id,
    });

    const presentNow = attendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOutToday = attendance.filter((a: any) => a.checked_out_at).length;
    const totalCheckins = attendance.length;
    const attendanceRate = children.length > 0 ? Math.round((totalCheckins / children.length) * 100) : 0;

    const pieData = [
        { name: t('presentNow'), value: presentNow },
        { name: t('checkedOut'), value: checkedOutToday },
        { name: t('out'), value: Math.max(0, children.length - totalCheckins) },
    ];

    const ageDistribution = [
        { age: "0-2", count: children.filter((c: any) => c.age <= 2).length },
        { age: "3-5", count: children.filter((c: any) => c.age >= 3 && c.age <= 5).length },
        { age: "6-9", count: children.filter((c: any) => c.age >= 6 && c.age <= 9).length },
        { age: "10+", count: children.filter((c: any) => c.age >= 10).length },
    ];

    const quickActions = [
        { title: t('checkInKiosk'), description: t('checkInKioskDesc'), icon: QrCode, color: "bg-indigo-600 shadow-indigo-100", path: "/check-in" },
        { title: t('printQRLabels'), description: t('printQRLabelsDesc'), icon: Printer, color: "bg-emerald-600 shadow-emerald-100", path: "/qr-management" },
        { title: t('staffSchedules'), description: t('staffSchedulesDesc'), icon: Calendar, color: "bg-rose-600 shadow-rose-100", path: "/staff/schedules" },
        { title: t('manageUsers'), description: t('manageUsersDesc'), icon: Users, color: "bg-blue-600 shadow-blue-100", path: "/users" },
        { title: t('deviceEnrollment'), description: t('deviceEnrollmentDesc'), icon: Monitor, color: "bg-purple-600 shadow-purple-100", path: "/devices" },
        { title: t('centerFinder'), description: t('centerFinderDesc'), icon: Globe, color: "bg-sky-600 shadow-sky-100", path: "/centers" },
        { title: t('reportsAnalytics'), description: t('reportsAnalyticsDesc'), icon: BarChart3, color: "bg-orange-600 shadow-orange-100", path: "/reports" },
        { title: t('organizationSettings'), description: t('organizationSettingsDesc'), icon: Settings, color: "bg-slate-700 shadow-slate-100", path: "/settings" },
    ].filter(action => {
        if (action.path === "/centers" && settings?.show_center_finder === false) return false;
        return true;
    });

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto py-12 px-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"
            >
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        Admin Overview
                        <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[11px] px-3 h-6 rounded-full">
                            Dashboard
                        </Badge>
                    </h1>
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{today}</p>
                        <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">{totalCheckins} check-ins today</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl px-6 py-4 rounded-2xl border border-white dark:border-white/5 flex items-center gap-4 shadow-sm group">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 blur-sm animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{t('systemLive')}</span>
                    </div>
                    
                    <Button 
                        onClick={() => navigate("/check-in")} 
                        className="h-14 px-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                    >
                        <QrCode className="h-5 w-5" />
                        {t('launchKiosk')}
                    </Button>
                </div>
            </motion.div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    index={0} title={t('totalChildren')} value={children.length}
                    icon={Baby} gradient="vcard-accent-primary"
                    change={t('enrolledSystem')} changeType="neutral"
                    subtitle={`${children.filter((c: any) => c.allergies).length} health alerts`}
                    onClick={() => navigate("/children")}
                />
                <StatCard
                    index={1} title={t('presentNow')} value={presentNow}
                    icon={UserCheck} gradient="vcard-accent-success"
                    change={`${attendanceRate}% RATE`} changeType="up"
                    subtitle={`${totalCheckins} check-ins today`}
                    onClick={() => navigate("/attendance")}
                />
                <StatCard
                    index={2} title="Operational Staff" value={staff.length}
                    icon={Shield} gradient="vcard-accent-info"
                    change={t('activeTeamMembers')} changeType="neutral"
                    subtitle={`${classes.length} active classes`}
                    onClick={() => navigate("/staff")}
                />
                <StatCard
                    index={3} title={t('messages')} value={messages.length}
                    icon={MessageSquare} gradient="vcard-accent-warning"
                    change={t('unreadMessages')} changeType={messages.length > 0 ? "down" : "neutral"}
                    subtitle="Inbox messages"
                    onClick={() => navigate("/messages")}
                />
            </div>

            {/* Matrix Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Block */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Attendance Trends
                        </h2>
                        <Badge variant="outline" className="text-slate-500 border-slate-200 dark:border-white/10 font-medium text-[10px] px-3 h-6 rounded-full">
                            Last 7 Days
                        </Badge>
                    </div>
                    
                    <Card className="floating-island p-10 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={weeklyAttendance}>
                                <defs>
                                    <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.5} />
                                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ 
                                        borderRadius: "20px", 
                                        border: "none", 
                                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                                        background: "white",
                                        padding: "16px"
                                    }}
                                />
                                <Area type="monotone" dataKey="checkins" stroke={COLORS.primary} strokeWidth={4} fill="url(#attendanceGrad)" dot={{ fill: COLORS.primary, strokeWidth: 0, r: 4 }} activeDot={{ r: 8, strokeWidth: 0 }} name="Check-ins" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </motion.div>

                {/* Status Breakdown */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Cpu className="h-5 w-5 text-emerald-500" />
                            Attendance Ratio
                        </h2>
                    </div>

                    <Card className="floating-island p-10 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={[COLORS.primary, COLORS.success, "rgba(0,0,0,0.05)"][i]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            {pieData.map((item, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5">
                                    <p className="text-[9px] font-bold text-slate-400 tracking-tight mb-1">{item.name}</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Systems Row */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Quick Actions
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, i) => (
                        <ActionCard key={i} {...action} index={i} onClick={() => navigate(action.path)} />
                    ))}
                </div>
            </div>

            {/* Telemetry Log */}
            <div className="space-y-6 pb-24">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                        <Activity className="h-6 w-6 text-indigo-500" />
                        Recent Activity
                    </h2>
                    <Button variant="ghost" onClick={() => navigate("/attendance")} className="h-10 px-6 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-500">
                        View All <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <Card className="floating-island rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {attendance.length === 0 ? (
                            <div className="col-span-2 py-32 text-center">
                                <Activity className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                                <p className="text-sm font-bold text-slate-400">No activity today</p>
                            </div>
                        ) : (
                            attendance.slice(0, 10).map((record: any, idx: number) => (
                                <motion.div 
                                    key={record.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (idx * 0.05) }}
                                    className="p-8 flex items-center gap-6 hover:bg-white dark:hover:bg-slate-900 transition-all border-r border-b border-slate-50 dark:border-white/5 last:border-b-0 group"
                                >
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform relative">
                                        {record.children?.photo_url ? (
                                            <img src={record.children.photo_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <Baby className="h-7 w-7 text-slate-300" />
                                        )}
                                        {record.checked_out_at ? (
                                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px]">
                                                <LogOut className="h-6 w-6 text-white" />
                                            </div>
                                        ) : (
                                            <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate mb-1">
                                            {record.children?.first_name} {record.children?.last_name}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-500 dark:text-slate-400">
                                                <Clock className="h-3 w-3 text-indigo-500" />
                                                {record.checked_out_at
                                                    ? `Departure: ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                    : `Arrival: ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`}
                                            </div>
                                            {record.children?.age && <span className="font-bold text-[10px] text-slate-400 dark:text-slate-500">Age: {record.children.age}y</span>}
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "font-bold text-[10px] tracking-tight px-4 h-8 rounded-full border-none", 
                                            record.checked_out_at ? "bg-slate-100 text-slate-400" : "bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none"
                                        )}
                                    >
                                        {record.checked_out_at ? "Checked out" : "Present"}
                                    </Badge>
                                </motion.div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboardNew;
