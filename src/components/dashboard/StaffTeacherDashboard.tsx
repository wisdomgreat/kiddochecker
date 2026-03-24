import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
    Users, Baby, ClipboardCheck, CheckCircle2, XCircle, LogIn, LogOut,
    ChevronRight, Clock, BookOpen, MessageSquare, QrCode, Calendar,
    AlertTriangle, Activity, Star, Target, Bell, Sparkles, Zap, Shield, Radar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" }
    })
};

const StaffTeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const today = format(new Date(), "EEEE, MMMM dd, yyyy");

    const { data: myClasses = [] } = useQuery({
        queryKey: ["staff-my-classes", user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from("classes")
                .select("*, class_teachers(user_id)")
                .limit(10);
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

    const { data: myClassIds = [] } = useQuery({
        queryKey: ["staff-my-class-ids", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data } = await supabase
                .from("teachers")
                .select("class_id")
                .eq("user_id", user.id);
            return (data || []).map((r: any) => r.class_id).filter(Boolean);
        },
        enabled: !!user?.id,
    });

    const { data: children = [] } = useQuery({
        queryKey: ["staff-my-children", myClassIds],
        queryFn: async () => {
            if (myClassIds.length === 0) return [];
            const { data } = await (supabase as any)
                .from("children")
                .select("*")
                .in("class_id", myClassIds)
                .order("first_name");
            return data || [];
        },
        enabled: myClassIds.length > 0,
    });

    const { data: messages = [] } = useQuery({
        queryKey: ["staff-messages-unread", user?.id],
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

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const unreadMessages = messages.filter((m: any) => !m.is_read).length;
    const withAllergies = children.filter((c: any) => c.allergies).length;

    // Build hourly distribution from today's attendance
    const hourlyData = Array.from({ length: 12 }, (_, i) => {
        const hour = i + 7;
        const count = todayAttendance.filter((a: any) => {
            if (!a.checked_in_at) return false;
            return new Date(a.checked_in_at).getHours() === hour;
        }).length;
        return { hour: `${hour}:00`, count };
    });

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto py-12 px-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            Teacher Overview
                            <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[11px] px-3 h-6 rounded-full">
                                Staff Active
                            </Badge>
                        </h1>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{today}</p>
                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-500">Welcome back, {user?.email?.split('@')[0]}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => navigate("/messages")}
                            className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                        >
                            <MessageSquare className="h-4 w-4" />
                            {t('messages')}
                            {unreadMessages > 0 && (
                                <span className="bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold">
                                    {unreadMessages}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('presentNow'), value: presentNow, icon: CheckCircle2, color: "emerald", desc: "Children present" },
                    { label: t('checkedOut'), value: checkedOut, icon: XCircle, color: "slate", desc: "Safe departures" },
                    { label: t('totalToday'), value: todayAttendance.length, icon: ClipboardCheck, color: "indigo", desc: "Total daily activity" },
                    { label: t('allergyAlert'), value: withAllergies, icon: AlertTriangle, color: "amber", desc: "Health alerts" },
                ].map(({ label, value, icon: Icon, color, desc }, idx) => (
                    <motion.div 
                        key={label} 
                        custom={idx} 
                        variants={cardVariants} 
                        initial="hidden" 
                        animate="show"
                    >
                        <Card className={cn(
                            "floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden relative group h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl",
                            color === 'amber' ? 'ring-2 ring-amber-500/20 bg-amber-50/30' : ''
                        )}>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className={cn(
                                        "text-xs font-semibold tracking-tight mb-1",
                                        `text-${color}-500`
                                    )}>{label}</p>
                                    <h3 className={cn(
                                        "text-4xl font-bold tracking-tight",
                                        `text-${color}-600`
                                    )}>
                                        {value}
                                    </h3>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-3">{desc}</p>
                                </div>
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm",
                                    `bg-${color}-50 dark:bg-white/5`
                                )}>
                                    <Icon className={cn("h-7 w-7", `text-${color}-600`)} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Pulse Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Radar className="h-5 w-5 text-indigo-500" />
                            Attendance Pulse
                        </h2>
                        <Badge variant="outline" className="text-slate-500 border-slate-200 dark:border-white/10 font-medium text-[10px] px-3 h-6 rounded-full">
                            Hourly Flow
                        </Badge>
                    </div>
                    
                    <Card className="floating-island p-10 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={hourlyData} barCategoryGap="40%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.5} />
                                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Volume">
                                    {hourlyData.map((_, i) => <Cell key={i} fill={i === new Date().getHours() - 7 ? "#6366f1" : "rgba(99, 102, 241, 0.2)"} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </motion.div>

                {/* Assigned Clusters */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Zap className="h-5 w-5 text-amber-500" />
                            My Classes
                        </h2>
                    </div>

                    <Card className="floating-island rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl overflow-hidden flex flex-col h-[340px]">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-xs font-bold text-slate-500 tracking-tight">{myClasses.length} active classes</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50 dark:divide-white/5">
                            {myClasses.length === 0 ? (
                                <div className="p-12 text-center">
                                    <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                                    <p className="text-[10px] font-bold text-slate-400">No classes assigned</p>
                                </div>
                            ) : (
                                myClasses.map((cls: any) => (
                                    <div key={cls.id} className="p-6 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer group" onClick={() => navigate("/classes")}>
                                        <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            <Shield className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight mb-1">{cls.name}</p>
                                            <p className="text-[9px] font-medium text-slate-400">{cls.age_group || "General class"}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Field Activity Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Activity Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                            <Activity className="h-6 w-6 text-emerald-500" />
                            Recent Activity
                        </h2>
                        <Button variant="ghost" onClick={() => navigate("/attendance")} className="h-10 px-6 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500">
                             View All <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    <Card className="floating-island rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                        <div className="divide-y divide-slate-50 dark:divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {todayAttendance.length === 0 ? (
                                <div className="py-24 text-center">
                                    <ClipboardCheck className="h-12 w-12 mx-auto text-slate-100 mb-4" />
                                    <p className="text-sm font-bold text-slate-400">Waiting for activity...</p>
                                </div>
                            ) : (
                                todayAttendance.slice(0, 15).map((record: any) => (
                                    <div key={record.id} className="p-8 flex items-center gap-6 hover:bg-white dark:hover:bg-slate-900 transition-all group">
                                        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform relative">
                                            {record.children?.photo_url ? (
                                                <img src={record.children.photo_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <Baby className="h-7 w-7 text-slate-300" />
                                            )}
                                            {record.checked_out_at ? (
                                                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px]">
                                                    <LogOut className="h-5 w-5 text-white" />
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
                                                {record.children?.allergies && (
                                                    <Badge className="bg-rose-500/10 text-rose-500 border-none font-bold text-[9px] h-5 flex items-center">Allergy Alert</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "font-bold text-[10px] tracking-tight px-4 h-8 rounded-full border-none",
                                            record.checked_out_at ? "bg-slate-100 text-slate-400" : "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none"
                                        )}>
                                            {record.checked_out_at ? "Checked out" : "Present"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Tactical Ops Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="space-y-6"
                >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Zap className="h-5 w-5 text-indigo-500" />
                        Quick Links
                    </h2>
                    {[
                        { label: t('children'), icon: Baby, color: "bg-emerald-600 shadow-emerald-100", path: "/children", desc: "Manage students" },
                        { label: t('attendance'), icon: ClipboardCheck, color: "bg-indigo-600 shadow-indigo-100", path: "/attendance", desc: "Attendance log" },
                        { label: t('calendar'), icon: Calendar, color: "bg-slate-800 shadow-slate-200", path: "/calendar", desc: "View schedule" },
                        { label: t('messages'), icon: MessageSquare, color: "bg-rose-600 shadow-rose-100", path: "/messages", desc: "Messages" },
                    ].map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className="w-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 flex items-center gap-5 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group border border-slate-50 dark:border-white/5"
                        >
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110", action.color)}>
                                <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{action.label}</p>
                                <p className="text-[10px] font-medium text-slate-400">{action.desc}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-200 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default StaffTeacherDashboard;
