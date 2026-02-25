import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    QrCode, CheckCircle2, XCircle, Users, Clock, ChevronRight,
    LogIn, LogOut, Baby, AlertTriangle, MessageSquare, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay } from "date-fns";

const VolunteerDashboardNew = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const today = format(new Date(), "EEEE, MMMM dd");

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

    const { data: children = [] } = useQuery({
        queryKey: ["volunteer-children-count"],
        queryFn: async () => {
            const { data } = await supabase.from("children").select("id");
            return data || [];
        },
    });

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const allergyAlerts = todayAttendance.filter((a: any) => a.children?.allergies && !a.checked_out_at);

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Volunteer Station</h1>
                    <p className="text-slate-500 mt-1">{today}</p>
                </div>
            </motion.div>

            {/* Big KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="grid grid-cols-3 gap-4"
            >
                <div className="gradient-primary rounded-2xl p-6 text-white text-center shadow-lg">
                    <p className="text-5xl font-black">{presentNow}</p>
                    <p className="text-white/80 text-sm mt-1 font-medium">Present Now</p>
                </div>
                <div className="gradient-success rounded-2xl p-6 text-white text-center shadow-lg">
                    <p className="text-5xl font-black">{todayAttendance.length}</p>
                    <p className="text-white/80 text-sm mt-1 font-medium">Total Check-ins</p>
                </div>
                <div className="gradient-warning rounded-2xl p-6 text-white text-center shadow-lg">
                    <p className="text-5xl font-black">{checkedOut}</p>
                    <p className="text-white/80 text-sm mt-1 font-medium">Checked Out</p>
                </div>
            </motion.div>

            {/* Primary Action */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <button
                    onClick={() => navigate("/check-in")}
                    className="w-full gradient-primary text-white rounded-2xl p-6 flex items-center justify-between shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-xl p-4">
                            <QrCode className="h-8 w-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-bold">Open Check-In Station</p>
                            <p className="text-white/75 text-sm">Tap to scan QR codes and check in children</p>
                        </div>
                    </div>
                    <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>

            {/* Secondary Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="grid grid-cols-2 gap-4"
            >
                <button
                    onClick={() => navigate("/check-out")}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
                >
                    <div className="bg-orange-50 rounded-xl p-3">
                        <LogOut className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">Check-Out Station</p>
                        <p className="text-xs text-slate-500">Process departures</p>
                    </div>
                </button>
                <button
                    onClick={() => navigate("/messages")}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
                >
                    <div className="bg-purple-50 rounded-xl p-3">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-slate-800 text-sm">Messages</p>
                        <p className="text-xs text-slate-500">Staff communication</p>
                    </div>
                </button>
            </motion.div>

            {/* Allergy Alerts */}
            {allergyAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h3 className="font-bold text-amber-800">Allergy Alerts — Children Present</h3>
                    </div>
                    <div className="space-y-2">
                        {allergyAlerts.map((record: any) => (
                            <div key={record.id} className="bg-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-amber-900 text-sm">{record.children?.first_name} {record.children?.last_name}</p>
                                    <p className="text-xs text-amber-700 mt-0.5">{record.children?.allergies}</p>
                                </div>
                                <Badge className="badge-warning text-xs">Alert</Badge>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Live Feed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            >
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-slate-800">Live Feed</h3>
                    <Badge variant="outline" className="ml-auto text-xs">Updates every 15s</Badge>
                </div>
                <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                    {todayAttendance.length === 0 ? (
                        <div className="p-10 text-center">
                            <Clock className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500 text-sm">Waiting for first check-in...</p>
                        </div>
                    ) : (
                        todayAttendance.slice(0, 12).map((record: any) => (
                            <div key={record.id} className="px-5 py-3.5 flex items-center gap-3">
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
                                            : `Checked in at ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`
                                        }
                                    </p>
                                </div>
                                {record.children?.allergies && !record.checked_out_at && (
                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default VolunteerDashboardNew;
