import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useTranslation } from "@/lib/i18n";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
    Baby, Clock, Calendar, MessageSquare, AlertTriangle, Phone,
    QrCode, ChevronRight, CheckCircle2, XCircle, LogIn, LogOut,
    Bell, Heart, Shield, Activity, Award, Sparkles, Zap, Star
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" }
    })
};

const ParentDashboardNew = () => {
    const { user } = useAuth();
    const { messages, unreadCount, isLoading: messagesLoading } = useMessages();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data: myChildren = [], isLoading } = useQuery({
        queryKey: ["parent-my-children", user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data } = await supabase
                .from("children")
                .select("*")
                .eq("parent_id", user.id);
            return data || [];
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
                .select("*, children(first_name, last_name)")
                .in("child_id", childIds)
                .order("attendance_date", { ascending: false })
                .limit(15);
            return data || [];
        },
        enabled: !!user?.id && myChildren.length > 0,
    });

    // Build attendance trend for graph (last 7 days)
    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, "yyyy-MM-dd");
        const checked = recentAttendance.filter((a: any) => a.attendance_date === dateStr).length;
        return { day: format(d, "EEE"), attended: checked };
    });

    const today = format(new Date(), "EEEE, MMMM dd");
    const unreadMessages = unreadCount;
    const presentToday = recentAttendance.filter((a: any) =>
        a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
    ).length;

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto py-12 px-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            Parent Dashboard
                            <Badge className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold text-[11px] px-3 h-6 rounded-full">
                                Family Overview
                            </Badge>
                        </h1>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{today}</p>
                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-500">Check-in active</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => navigate("/parent/messages")}
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
                    { label: t('myChildren'), value: myChildren.length, icon: Baby, color: "rose", desc: "Registered children" },
                    { label: t('presentToday'), value: presentToday, icon: CheckCircle2, color: "emerald", desc: "Currently checked in" },
                    { label: 'Total Points', value: myChildren.reduce((acc: number, curr: any) => acc + (curr.points_balance || 0), 0), icon: Award, color: "amber", desc: "Rewards balance" },
                    { label: 'Unread Comms', value: unreadMessages, icon: MessageSquare, color: "indigo", desc: "New messages" },
                ].map(({ label, value, icon: Icon, color, desc }, idx) => (
                    <motion.div key={label} custom={idx} variants={cardVariants} initial="hidden" animate="show">
                        <Card className={cn(
                            "floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 overflow-hidden relative group h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl"
                        )}>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className={cn("text-xs font-semibold tracking-tight mb-1", `text-${color}-500`)}>{label}</p>
                                    <h3 className={cn("text-4xl font-bold tracking-tight", `text-${color}-600`)}>{value}</h3>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-3">{desc}</p>
                                </div>
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm", `bg-${color}-50 dark:bg-white/5`)}>
                                    <Icon className={cn("h-7 w-7", `text-${color}-600`)} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Family Roster */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                            <Activity className="h-6 w-6 text-rose-500" />
                            My Children
                        </h2>
                        <Button variant="ghost" onClick={() => navigate("/parent/children")} className="h-10 px-6 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-500">
                             Manage Children <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="grid gap-6">
                            {[1, 2].map((i) => <div key={i} className="h-48 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />)}
                        </div>
                    ) : myChildren.length === 0 ? (
                        <Card className="floating-island rounded-[3rem] p-20 text-center border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Baby className="h-10 w-10 text-rose-300" />
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">{t('noChildrenRegistered')}</p>
                            <Button onClick={() => navigate("/parent/children")} className="mt-8 h-14 px-8 bg-rose-600 hover:bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-tight shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                                {t('addChild')}
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {myChildren.map((child: any, i: number) => {
                                const childAttendance = recentAttendance.filter((a: any) => a.child_id === child.id);
                                const isAtCenter = childAttendance.some((a: any) =>
                                    a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
                                );

                                return (
                                    <motion.div
                                        key={child.id}
                                        custom={i}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl transition-all duration-500 relative group overflow-hidden border border-slate-50 dark:border-white/5"
                                    >
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 relative z-10">
                                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl group-hover:rotate-3 transition-transform duration-700 relative">
                                                    {child.first_name?.[0]}{child.last_name?.[0]}
                                                    {isAtCenter && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                                                </div>
                                                <div className="space-y-4 text-center sm:text-left">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">{child.first_name} {child.last_name}</h3>
                                                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">ID: {child.id.substring(0, 8).toUpperCase()}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                                        <Badge className={cn("font-bold text-[10px] h-6 px-4 tracking-tight border-none", isAtCenter ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-slate-100 text-slate-400 dark:bg-white/5")}>
                                                            {isAtCenter ? "At center" : "At home"}
                                                        </Badge>
                                                        {child.allergies && (
                                                            <Badge className="bg-rose-500/10 text-rose-500 border-none font-bold text-[10px] h-6 px-4 tracking-tight">Allergy Alert</Badge>
                                                        )}
                                                        <Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold text-[10px] h-6 px-4 tracking-tight">
                                                            {child.points_balance || 0} Points
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-center sm:items-end gap-3 min-w-[120px]">
                                                <Button 
                                                    onClick={() => navigate("/parent/children")}
                                                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs tracking-tight shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                                                >
                                                    <QrCode className="h-4 w-4" /> Quick Check-in
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    onClick={() => navigate("/parent/attendance")}
                                                    className="w-full h-12 rounded-xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    Attendance History
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Tactical Column */}
                <div className="space-y-8">
                    {/* Attendance Trend */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 }}
                        className="space-y-6"
                    >
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 px-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Attendance Trends
                        </h2>
                        <Card className="floating-island p-8 rounded-[2.5rem] border-none shadow-sm dark:shadow-black/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl">
                            <ResponsiveContainer width="100%" height={160}>
                                <AreaChart data={attendanceTrend}>
                                    <defs>
                                        <linearGradient id="parentTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} opacity={0.5} />
                                    <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} hide />
                                    <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }} />
                                    <Area type="monotone" dataKey="attended" stroke="#6366f1" strokeWidth={4} fill="url(#parentTrend)" dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 8 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    </motion.div>

                    {/* Quick System Access */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 px-2">
                            <Zap className="h-5 w-5 text-amber-500" />
                            Quick Links
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: t('attendance'), icon: Clock, path: "/parent/attendance", color: "indigo" },
                                { label: t('calendar'), icon: Calendar, path: "/calendar", color: "rose" },
                                { label: t('myProfile'), icon: Shield, path: "/parent/profile", color: "emerald" },
                                { label: t('messages'), icon: MessageSquare, path: "/parent/messages", color: "amber" },
                            ].map((link) => (
                                <button
                                    key={link.label}
                                    onClick={() => navigate(link.path)}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group border border-slate-50 dark:border-white/5"
                                >
                                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", `bg-${link.color}-50 dark:bg-white/5`)}>
                                        <link.icon className={cn("h-6 w-6", `text-${link.color}-600`)} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight text-center">{link.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Secure Signal Update */}
                    <Card className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Dashboard Status</h4>
                                <p className="text-[10px] font-medium text-indigo-100 mt-1 opacity-90">Everything is up to date</p>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboardNew;
