import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
    Users, Baby, ClipboardCheck, CheckCircle2, XCircle, LogIn, LogOut,
    ChevronRight, Clock, BookOpen, MessageSquare, QrCode, Calendar,
    AlertTriangle, Activity, Star, Target, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, startOfDay, endOfDay } from "date-fns";

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
                .select("*, children(first_name, last_name, age, allergies)")
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
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
                        <p className="text-slate-500 mt-1 text-sm flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" /> {today}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/messages")}>
                            <Bell className="h-4 w-4" />
                            {unreadMessages > 0 && (
                                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 h-auto ml-0.5">{unreadMessages}</Badge>
                            )}
                            Messages
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Present Now", value: presentNow, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", index: 0, path: "/attendance" },
                    { label: "Checked Out", value: checkedOut, icon: XCircle, color: "text-slate-500", bg: "bg-slate-50", index: 1, path: "/attendance" },
                    { label: "Total Today", value: todayAttendance.length, icon: ClipboardCheck, color: "text-indigo-600", bg: "bg-indigo-50", index: 2, path: "/attendance" },
                    { label: "Alert: Allergies", value: withAllergies, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", index: 3, path: "/children" },
                ].map(({ label, value, icon: Icon, color, bg, index, path }) => (
                    <motion.div key={label} custom={index} variants={cardVariants} initial="hidden" animate="show">
                        <div
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => navigate(path)}
                        >
                            <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <p className="text-3xl font-bold text-slate-800">{value}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Check-in Timeline Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Hourly Check-in Distribution</h3>
                            <p className="text-sm text-slate-500">Check-in activity by hour today</p>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200">
                            <Activity className="h-3 w-3 mr-1" />Today
                        </Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={hourlyData} barCategoryGap="40%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Check-ins">
                                {hourlyData.map((_, i) => <Cell key={i} fill={i === new Date().getHours() - 7 ? "#6366f1" : "#c7d2fe"} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* My Classes */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-slate-800">My Classes</h3>
                            <p className="text-xs text-slate-500">{myClasses.length} assigned</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/classes")} className="rounded-xl text-xs">
                            Manage
                        </Button>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
                        {myClasses.length === 0 ? (
                            <div className="p-8 text-center">
                                <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-500 text-sm">No classes assigned</p>
                            </div>
                        ) : (
                            myClasses.map((cls: any) => (
                                <div key={cls.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/classes")}>
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{cls.name}</p>
                                        <p className="text-xs text-slate-500">{cls.age_group || "All ages"}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Live Attendance Feed + Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h3 className="font-bold text-slate-800">Live Attendance Feed</h3>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate("/attendance")} className="rounded-xl text-xs gap-1">
                            View All <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                        {todayAttendance.length === 0 ? (
                            <div className="p-12 text-center">
                                <ClipboardCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-500 text-sm">No entries today yet</p>
                            </div>
                        ) : (
                            todayAttendance.slice(0, 10).map((record: any) => (
                                <div key={record.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${record.checked_out_at ? "bg-slate-100" : "bg-emerald-100"}`}>
                                        {record.checked_out_at ? <LogOut className="h-3.5 w-3.5 text-slate-500" /> : <LogIn className="h-3.5 w-3.5 text-emerald-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm">
                                            {record.children?.first_name} {record.children?.last_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <span className="text-xs text-slate-500">
                                                {record.checked_out_at
                                                    ? `Out at ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                    : `In at ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`}
                                            </span>
                                            {record.children?.allergies && (
                                                <Badge className="badge-warning text-xs px-1 py-0">Allergy</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className={record.checked_out_at ? "badge-warning" : "badge-success"} variant="outline">
                                        {record.checked_out_at ? "Out" : "Present"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="space-y-3"
                >
                    <h3 className="font-bold text-slate-800">Quick Actions</h3>
                    {[
                        { label: "View Children", icon: Baby, color: "bg-emerald-600 hover:bg-emerald-700", path: "/children" },
                        { label: "Attendance Record", icon: ClipboardCheck, color: "bg-blue-600 hover:bg-blue-700", path: "/attendance" },
                        { label: "My Calendar", icon: Calendar, color: "bg-purple-600 hover:bg-purple-700", path: "/calendar" },
                        { label: "Messages", icon: MessageSquare, color: "bg-orange-500 hover:bg-orange-600", path: "/messages" },
                    ].map((action) => (
                        <button
                            key={action.label}
                            onClick={() => navigate(action.path)}
                            className={`w-full ${action.color} text-white rounded-xl px-4 py-3 flex items-center gap-3 transition-all font-medium text-sm shadow-sm hover:shadow-md`}
                        >
                            <action.icon className="h-4 w-4" />
                            {action.label}
                            <ChevronRight className="h-4 w-4 ml-auto" />
                        </button>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default StaffTeacherDashboard;
