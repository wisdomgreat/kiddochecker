import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useTranslation } from "@/lib/i18n";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
    Baby, Clock, Calendar, MessageSquare, AlertTriangle, Phone,
    QrCode, ChevronRight, CheckCircle2, XCircle, LogIn, LogOut,
    Bell, Heart, Shield, Activity, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, subDays } from "date-fns";

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
    const childrenWithAllergies = myChildren.filter((c: any) => c.allergies);
    const presentToday = recentAttendance.filter((a: any) =>
        a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
    ).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{t('parentPortal')}</h1>
                        <p className="text-slate-500 mt-1 text-sm">{today}</p>
                    </div>
                    <div className="flex gap-3">
                        {unreadMessages > 0 && (
                            <Button variant="outline" onClick={() => navigate("/parent/messages")} className="rounded-xl gap-2 border-red-200 text-red-600 hover:bg-red-50">
                                <Bell className="h-4 w-4" />
                                {unreadMessages} {t('new')}
                            </Button>
                        )}
                        <Button onClick={() => navigate("/check-in")} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2">
                            <QrCode className="h-4 w-4" />
                            {t('quickCheckIn')}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('myChildren'), value: myChildren.length, icon: Baby, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", index: 0, path: "/parent/children" },
                    { label: t('presentToday'), value: presentToday, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", index: 1, path: "/parent/attendance" },
                    { label: t('rewardsTitle'), value: myChildren.reduce((acc: number, curr: any) => acc + (curr.points_balance || 0), 0), icon: Award, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", index: 2, path: "/parent/rewards" },
                    { label: t('messages'), value: messages.length, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", index: 3, path: "/parent/messages" },
                ].map(({ label, value, icon: Icon, color, bg, border, index, path }) => (
                    <motion.div key={label} custom={index} variants={cardVariants} initial="hidden" animate="show">
                        <div
                            className={`bg-white rounded-2xl p-5 shadow-sm border ${border} hover:shadow-md transition-all cursor-pointer group`}
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

            {/* My Children Grid + Attendance Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Children */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{t('myChildren')}</h3>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => navigate("/parent/children")}>
                            {t('viewAll')} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : myChildren.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                            <Baby className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-600">{t('noChildrenRegistered')}</p>
                            <p className="text-sm text-slate-500 mb-4">{t('addChildrenToGetStarted')}</p>
                            <Button onClick={() => navigate("/parent/children")} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                                {t('addChild')}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {myChildren.map((child: any, i: number) => {
                                const childAttendance = recentAttendance.filter((a: any) => a.child_id === child.id);
                                const presentNow = childAttendance.some((a: any) =>
                                    a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
                                );
                                const attendanceDays = childAttendance.length;

                                return (
                                    <motion.div
                                        key={child.id}
                                        custom={i}
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-indigo-700">
                                                    {child.first_name?.[0]}{child.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-lg">{child.first_name} {child.last_name}</p>
                                                    <p className="text-sm text-slate-500">{child.age ? `${child.age} ${t('yearsOld')}` : t('ageNotSet')}</p>
                                                    <div className="flex gap-2 mt-1.5">
                                                        {presentNow && (
                                                            <Badge className="badge-success text-xs">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />{t('presentNow')}
                                                            </Badge>
                                                        )}
                                                        {child.allergies && (
                                                            <Badge className="badge-warning text-xs">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />{t('allergyAlert')}
                                                            </Badge>
                                                        )}
                                                        {child.emergency_contact_name && (
                                                            <Badge className="badge-info text-xs">
                                                                <Phone className="h-3 w-3 mr-1" />Emergency Contact
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-indigo-600">{attendanceDays}</p>
                                                <p className="text-xs text-slate-500">{t('daysAttended')}</p>
                                                <div className="mt-2 flex items-center justify-end gap-1 text-amber-600">
                                                    <Award className="h-3 w-3" />
                                                    <p className="text-sm font-bold">{child.points_balance || 0}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {child.allergies && (
                                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> {t('allergyInformation')}
                                                </p>
                                                <p className="text-xs text-amber-700 mt-0.5">{child.allergies}</p>
                                            </div>
                                        )}

                                        <div className="mt-4 flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl flex-1 text-xs"
                                                onClick={() => navigate("/parent/attendance")}
                                            >
                                                <Clock className="h-3 w-3 mr-1.5" />{t('attendance')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl flex-1 text-xs"
                                                onClick={() => navigate("/parent/children")}
                                            >
                                                <QrCode className="h-3 w-3 mr-1.5" />QR Code
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Attendance Trend + Messages */}
                <div className="space-y-5">
                    {/* Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                    >
                        <h3 className="font-bold text-slate-800 mb-1">{t('sevenDayAttendance')}</h3>
                        <p className="text-xs text-slate-500 mb-4">Your children's attendance this week</p>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={attendanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                                <Line type="monotone" dataKey="attended" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 3 }} name="Attended" />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Recent Messages */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm">{t('recentMessages')}</h3>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs h-7" onClick={() => navigate("/parent/messages")}>
                                {t('viewAll')}
                            </Button>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="p-6 text-center">
                                    <MessageSquare className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-500">No messages yet</p>
                                </div>
                            ) : (
                                messages.map((msg: any) => (
                                    <div key={msg.id} className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate("/parent/messages")}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{msg.subject || "No subject"}</p>
                                            {!msg.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{msg.content}</p>
                                        <p className="text-xs text-slate-400 mt-1">{format(new Date(msg.created_at), "MMM dd, HH:mm")}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                        className="grid grid-cols-2 gap-3"
                    >
                        {[
                            { label: t('attendance'), icon: Clock, path: "/parent/attendance", color: "bg-blue-50 text-blue-600" },
                            { label: t('calendar'), icon: Calendar, path: "/calendar", color: "bg-purple-50 text-purple-600" },
                            { label: t('myProfile'), icon: Shield, path: "/parent/profile", color: "bg-emerald-50 text-emerald-600" },
                            { label: t('messages'), icon: MessageSquare, path: "/parent/messages", color: "bg-orange-50 text-orange-600" },
                        ].map((link) => (
                            <button
                                key={link.label}
                                onClick={() => navigate(link.path)}
                                className={`${link.color} rounded-xl p-3.5 text-center hover:opacity-80 transition-opacity`}
                            >
                                <link.icon className="h-5 w-5 mx-auto mb-1" />
                                <p className="text-xs font-semibold">{link.label}</p>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboardNew;
