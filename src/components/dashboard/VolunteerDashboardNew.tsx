import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import {
    QrCode, Users, Clock, ChevronRight,
    LogIn, LogOut, AlertTriangle, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, endOfDay } from "date-fns";

const VolunteerDashboardNew = () => {
    const { unreadCount } = useMessages();
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

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const allergyAlerts = todayAttendance.filter((a: any) => a.children?.allergies && !a.checked_out_at);

    return (
        <div className="space-y-8 max-w-2xl mx-auto py-10">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-slate-600" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Volunteer Portal</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{today}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="shadow-sm border-slate-900 bg-slate-900 text-white">
                    <CardContent className="p-6 text-center">
                        <p className="text-3xl font-bold">{presentNow}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Pending</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                        <p className="text-3xl font-bold">{todayAttendance.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                        <p className="text-3xl font-bold">{checkedOut}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Departed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Primary Action */}
            <button
                onClick={() => navigate("/check-in")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-foreground rounded-lg p-6 flex items-center justify-between transition-colors border shadow-sm group"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-card rounded-md p-3 border shadow-sm group-hover:shadow-md transition-shadow">
                        <QrCode className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-lg">Check-In Session</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">Launch scanning terminal</p>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => navigate("/check-out")}
                    className="bg-card rounded-lg p-4 border shadow-sm hover:bg-muted/50 transition-colors flex items-center gap-3 text-left"
                >
                    <div className="bg-slate-50 p-2 rounded border">
                        <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Departure Station</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Process exits</p>
                    </div>
                </button>
                <button
                    onClick={() => navigate("/messages")}
                    className="bg-card rounded-lg p-4 border shadow-sm hover:bg-muted/50 transition-colors flex items-center gap-3 text-left"
                >
                    <div className="bg-slate-50 p-2 rounded border relative">
                        <MessageSquare className="h-4 w-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 bg-slate-900 rounded-full border-2 border-white" />
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-sm">Messaging</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Staff channel</p>
                    </div>
                </button>
            </div>

            {/* Medical Alerts */}
            {allergyAlerts.length > 0 && (
                <div className="bg-slate-50 border rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Medical Record Alerts</h3>
                    </div>
                    <div className="space-y-2">
                        {allergyAlerts.map((record: any) => (
                            <div key={record.id} className="bg-card border rounded px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">{record.children?.first_name} {record.children?.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">{record.children?.allergies}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-bold">ACTIVE ALERT</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Feed */}
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b py-3 px-5 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session Log</CardTitle>
                    <Badge variant="outline" className="text-[9px] h-5 rounded-full">REALTIME</Badge>
                </CardHeader>
                <div className="divide-y max-h-80 overflow-y-auto">
                    {todayAttendance.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground">
                            <Clock className="h-6 w-6 mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for traffic...</p>
                        </div>
                    ) : (
                        todayAttendance.slice(0, 12).map((record: any) => (
                            <div key={record.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                    {record.checked_out_at
                                        ? <LogOut className="h-3.5 w-3.5 opacity-40" />
                                        : <LogIn className="h-3.5 w-3.5 text-slate-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{record.children?.first_name} {record.children?.last_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                        {record.checked_out_at
                                            ? `Departed ${format(new Date(record.checked_out_at), "HH:mm")}`
                                            : `Arrived ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`
                                        }
                                    </p>
                                </div>
                                {record.children?.allergies && !record.checked_out_at && (
                                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

export default VolunteerDashboardNew;

