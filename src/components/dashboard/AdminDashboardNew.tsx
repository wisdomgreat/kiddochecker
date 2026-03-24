import React, { useState } from "react";
import { motion } from "framer-motion";
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
    Zap,
    Globe,
    BarChart3,
    Settings,
    ClipboardCheck,
    LogOut,
    LogIn,
    Bell,
    Star,
    Award
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
        <Card className={cn("relative overflow-hidden group transition-all duration-300 hover:shadow-2xl border-none p-6", gradient)}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-4 rounded-2xl transition-all duration-500 bg-white/20 backdrop-blur-md")}>
                    <Icon className={cn("w-7 h-7 text-white")} />
                </div>
                {change && (
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm",
                        changeType === "up" ? "bg-emerald-400/20 text-emerald-300" :
                        changeType === "down" ? "bg-red-400/20 text-red-300" : "text-white/70 bg-white/10"
                    )}>
                        {changeType === "up" && <TrendingUp className="w-4 h-4" />}
                        {changeType === "down" && <TrendingDown className="w-4 h-4" />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-black text-white/80 uppercase tracking-[0.15em] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black tracking-tighter text-white">{value}</h3>
                </div>
                {subtitle && <p className="text-xs font-medium text-white/70 leading-relaxed mt-1">{subtitle}</p>}
            </div>
        </Card>
    </motion.div>
);

const ActionCard = ({ title, description, icon: Icon, color, onClick, index }: any) => (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="show">
        <Card className={cn("relative overflow-hidden p-8 flex flex-col items-center text-center group cursor-pointer border-none shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2")}>
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg", color)}>
                <Icon className={cn("w-8 h-8 text-white")} />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{title}</h4>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest">{description}</p>
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
                .select("*, children(first_name, last_name, age)")
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
        { title: t('checkInKiosk'), description: t('checkInKioskDesc'), icon: QrCode, color: "bg-indigo-500", path: "/check-in" },
        { title: t('printQRLabels'), description: t('printQRLabelsDesc'), icon: Printer, color: "bg-emerald-500", path: "/qr-management" },
        { title: t('staffSchedules'), description: t('staffSchedulesDesc'), icon: Calendar, color: "bg-rose-500", path: "/staff/schedules" },
        { title: t('manageUsers'), description: t('manageUsersDesc'), icon: Users, color: "bg-blue-500", path: "/users" },
        { title: t('deviceEnrollment'), description: t('deviceEnrollmentDesc'), icon: Zap, color: "bg-purple-500", path: "/devices" },
        { title: t('centerFinder'), description: t('centerFinderDesc'), icon: Globe, color: "bg-blue-500", path: "/centers" },
        { title: t('reportsAnalytics'), description: t('reportsAnalyticsDesc'), icon: BarChart3, color: "bg-orange-500", path: "/reports" },
        { title: t('organizationSettings'), description: t('organizationSettingsDesc'), icon: Settings, color: "bg-slate-500", path: "/settings" },
    ].filter(action => {
        if (action.path === "/centers" && settings?.show_center_finder === false) return false;
        return true;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('adminDashboard')}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{today}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        {t('systemLive')}
                    </Badge>
                    <Button onClick={() => navigate("/check-in")} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
                        <QrCode className="h-4 w-4" />
                        {t('launchKiosk')}
                    </Button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    index={0} title={t('totalChildren')} value={children.length}
                    icon={Baby} gradient="vcard-accent-primary"
                    change={t('enrolledSystem')} changeType="neutral"
                    subtitle={`${children.filter((c: any) => c.allergies).length} with allergies`}
                    onClick={() => navigate("/children")}
                />
                <StatCard
                    index={1} title={t('presentNow')} value={presentNow}
                    icon={UserCheck} gradient="vcard-accent-success"
                    change={`${attendanceRate}% attendance rate`} changeType="up"
                    subtitle={`${totalCheckins} total check-ins today`}
                    onClick={() => navigate("/attendance")}
                />
                <StatCard
                    index={2} title={t('staffMembersCount')} value={staff.length}
                    icon={Shield} gradient="vcard-accent-info"
                    change={t('activeTeamMembers')} changeType="neutral"
                    subtitle={`${classes.length} active classes`}
                    onClick={() => navigate("/staff")}
                />
                <StatCard
                    index={3} title={t('messages')} value={messages.length}
                    icon={MessageSquare} gradient="vcard-accent-warning"
                    change={t('unreadMessages')} changeType={messages.length > 0 ? "down" : "neutral"}
                    subtitle={t('officialInbox')}
                    onClick={() => navigate("/messages")}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Attendance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 chart-container"
                >
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={weeklyAttendance}>
                            <defs>
                                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                                labelStyle={{ fontWeight: 600, color: "#1e293b" }}
                            />
                            <Area type="monotone" dataKey="checkins" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} name="Check-ins" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Today's Status Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="chart-container"
                >
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{t('todaysStatus')}</h3>
                        <p className="text-sm text-slate-500">Real-time attendance breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={[COLORS.primary, COLORS.success, "#e2e8f0"][i]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                        {pieData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [COLORS.primary, COLORS.success, "#e2e8f0"][i] }} />
                                    <span className="text-sm text-slate-600">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Age Distribution + Quick Actions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Age Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="chart-container"
                >
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{t('ageDistribution')}</h3>
                        <p className="text-sm text-slate-500">Children by age group</p>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={ageDistribution} barCategoryGap="35%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                            <Bar dataKey="count" fill={COLORS.purple} radius={[6, 6, 0, 0]} name="Children" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-3">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">{t('quickActions')}</h3>
                    </motion.div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickActions.map((action, i) => (
                            <ActionCard key={i} {...action} index={i} onClick={() => navigate(action.path)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Live Feed + Staff + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Live Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{t('todaysFeed')}</h3>
                            <p className="text-sm text-slate-500">{t('eventsToday', { count: attendance.length.toString() })}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/attendance")} className="rounded-xl text-xs gap-1">
                            {t('viewAll')} <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                        {attendance.length === 0 ? (
                            <div className="p-12 text-center">
                                <ClipboardCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm">{t('noCheckins')}</p>
                            </div>
                        ) : (
                            attendance.slice(0, 8).map((record: any) => (
                                <div key={record.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${record.checked_out_at ? "bg-slate-100" : "bg-emerald-100"}`}>
                                        {record.checked_out_at
                                            ? <LogOut className="h-4 w-4 text-slate-500" />
                                            : <LogIn className="h-4 w-4 text-emerald-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm">{record.children?.first_name} {record.children?.last_name}</p>
                                        <p className="text-xs text-slate-500">
                                            {record.checked_out_at
                                                ? `Checked out at ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                : `Checked in at ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={record.checked_out_at ? "badge-warning" : "badge-success"}
                                    >
                                        {record.checked_out_at ? "Out" : "In"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboardNew;
