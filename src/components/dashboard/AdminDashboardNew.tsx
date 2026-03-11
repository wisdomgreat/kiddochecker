import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    Users, UserCheck, UserX, Baby, ClipboardCheck, TrendingUp,
    TrendingDown, QrCode, Printer, Shield, AlertTriangle, Activity,
    BookOpen, MessageSquare, Calendar, Settings, ChevronRight,
    Clock, CheckCircle2, XCircle, BarChart3, Bell, LogIn, LogOut,
    ArrowUpRight, ArrowDownRight, Zap, Star, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay, endOfDay, isToday } from "date-fns";

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
        <div className={`kpi-card text-white ${gradient} h-full flex flex-col justify-between min-h-[160px] transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider">{title}</p>
                    <p className="text-4xl font-extrabold tracking-tight">{value}</p>
                    {subtitle && <p className="text-white/70 text-xs font-medium leading-relaxed mt-1">{subtitle}</p>}
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 flex-shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
            {change && (
                <div className="mt-4 flex items-center gap-1.5 pt-4 border-t border-white/10">
                    {changeType === "up" ? (
                        <div className="p-0.5 bg-emerald-400/20 rounded-md">
                            <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                        </div>
                    ) : changeType === "down" ? (
                        <div className="p-0.5 bg-red-400/20 rounded-md">
                            <ArrowDownRight className="h-4 w-4 text-red-300" />
                        </div>
                    ) : null}
                    <span className={`text-sm font-semibold tracking-wide ${changeType === "up" ? "text-emerald-300" : changeType === "down" ? "text-red-300" : "text-white/70"}`}>
                        {change}
                    </span>
                </div>
            )}
        </div>
    </motion.div>
);

const ActionCard = ({ title, description, icon: Icon, color, onClick, index }: any) => (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="show">
        <button
            onClick={onClick}
            className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
        >
            <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>
        </button>
    </motion.div>
);

const AdminDashboardNew = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
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
        { name: "Present", value: presentNow },
        { name: "Checked Out", value: checkedOutToday },
        { name: "Not Arrived", value: Math.max(0, children.length - totalCheckins) },
    ];

    const ageDistribution = [
        { age: "0-2", count: children.filter((c: any) => c.age <= 2).length },
        { age: "3-5", count: children.filter((c: any) => c.age >= 3 && c.age <= 5).length },
        { age: "6-9", count: children.filter((c: any) => c.age >= 6 && c.age <= 9).length },
        { age: "10+", count: children.filter((c: any) => c.age >= 10).length },
    ];

    const quickActions = [
        { title: "Check-In Kiosk", description: "Launch the QR check-in station", icon: QrCode, color: "bg-indigo-500", path: "/check-in" },
        { title: "Print QR Labels", description: "Print QR codes for children", icon: Printer, color: "bg-emerald-500", path: "/qr-management" },
        { title: "Staff Schedules", description: "Manage team shifts & roster", icon: Calendar, color: "bg-rose-500", path: "/staff/schedules" },
        { title: "Manage Users", description: "Add, edit, and manage accounts", icon: Users, color: "bg-blue-500", path: "/users" },
        { title: "Device Enrollment", description: "Enroll kiosk & printer devices", icon: Zap, color: "bg-purple-500", path: "/devices" },
        { title: "Reports & Analytics", description: "View detailed attendance reports", icon: BarChart3, color: "bg-orange-500", path: "/reports" },
        { title: "Organization Settings", description: "Configure system preferences", icon: Settings, color: "bg-slate-500", path: "/settings" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1 text-sm">{today}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        System Live
                    </Badge>
                    <Button onClick={() => navigate("/check-in")} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
                        <QrCode className="h-4 w-4" />
                        Launch Kiosk
                    </Button>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    index={0} title="Total Children" value={children.length}
                    icon={Baby} gradient="gradient-primary"
                    change="Enrolled in system" changeType="neutral"
                    subtitle={`${children.filter((c: any) => c.allergies).length} with allergies`}
                    onClick={() => navigate("/children")}
                />
                <StatCard
                    index={1} title="Present Now" value={presentNow}
                    icon={UserCheck} gradient="gradient-success"
                    change={`${attendanceRate}% attendance rate`} changeType="up"
                    subtitle={`${totalCheckins} total check-ins today`}
                    onClick={() => navigate("/attendance")}
                />
                <StatCard
                    index={2} title="Staff Members" value={staff.length}
                    icon={Shield} gradient="gradient-info"
                    change="Active team members" changeType="neutral"
                    subtitle={`${classes.length} active classes`}
                    onClick={() => navigate("/staff")}
                />
                <StatCard
                    index={3} title="New Messages" value={messages.length}
                    icon={MessageSquare} gradient="gradient-warning"
                    change="Unread messages" changeType={messages.length > 0 ? "down" : "neutral"}
                    subtitle="In your official inbox"
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
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Weekly Attendance</h3>
                            <p className="text-sm text-slate-500">Check-in activity over the last 7 days</p>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200">
                            <Activity className="h-3 w-3 mr-1" /> Live
                        </Badge>
                    </div>
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
                        <h3 className="text-lg font-bold text-slate-800">Today's Status</h3>
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
                        <h3 className="text-lg font-bold text-slate-800">Age Distribution</h3>
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
                        <h3 className="text-lg font-bold text-slate-800 mb-3">Quick Actions</h3>
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
                            <h3 className="text-lg font-bold text-slate-800">Today's Check-in Feed</h3>
                            <p className="text-sm text-slate-500">{attendance.length} events today</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/attendance")} className="rounded-xl text-xs gap-1">
                            View All <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                        {attendance.length === 0 ? (
                            <div className="p-12 text-center">
                                <ClipboardCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm">No check-ins yet today</p>
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
