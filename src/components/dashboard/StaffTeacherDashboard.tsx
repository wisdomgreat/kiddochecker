import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
    Users, Baby, ClipboardCheck, CheckCircle2, XCircle,
    ChevronRight, Clock, BookOpen, MessageSquare, QrCode, Calendar,
    AlertTriangle, Activity, Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

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
                .select("*")
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

    const { data: messagesCount = 0 } = useQuery({
        queryKey: ["staff-messages-unread-count", user?.id],
        queryFn: async () => {
            if (!user?.id) return 0;
            const { count } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("recipient_id", user.id)
                .eq("is_read", false);
            return count || 0;
        },
        enabled: !!user?.id,
    });

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;

    const hourlyData = Array.from({ length: 12 }, (_, i) => {
        const hour = i + 7;
        const count = todayAttendance.filter((a: any) => {
            if (!a.checked_in_at) return false;
            return new Date(a.checked_in_at).getHours() === hour;
        }).length;
        return { hour: `${hour}:00`, count };
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Staff Overview</h1>
                    <p className="text-sm text-muted-foreground">{today} • Active status for {user?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/messages")} variant="default">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Inbox
                        {messagesCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-1.5 py-0 min-w-[20px] h-5 justify-center">
                                {messagesCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Present Now", value: presentNow, icon: CheckCircle2, color: "emerald" },
                    { label: "Checked Out", value: checkedOut, icon: XCircle, color: "slate" },
                    { label: "Total Entries", value: todayAttendance.length, icon: ClipboardCheck, color: "indigo" },
                    { label: "Alerts", value: todayAttendance.filter((a: any) => a.children?.allergies).length, icon: AlertTriangle, color: "amber" }
                ].map((s) => (
                    <Card key={s.label} className="shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-3xl font-bold tracking-tight">{s.value}</h3>
                                </div>
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <s.icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts and Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Attendance Flow</CardTitle>
                        <CardDescription>Children checked in per hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Assigned Classes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y max-h-[300px] overflow-y-auto">
                            {myClasses.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No active classes</p>
                                </div>
                            ) : (
                                myClasses.map((cls: any) => (
                                    <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("/classes")}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                <Badge variant="outline" className="h-4 w-4 p-0 rounded-full bg-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[150px]">{cls.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{cls.room || 'No Room'}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Log */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Real-time Feed</h2>
                    <Button variant="link" size="sm" onClick={() => navigate("/attendance")}>
                        Full Logs <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <Card className="shadow-sm overflow-hidden">
                    <div className="divide-y overflow-y-auto max-h-[500px]">
                        {todayAttendance.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Waiting for check-ins...</p>
                            </div>
                        ) : (
                            todayAttendance.map((record: any) => (
                                <div key={record.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                            {record.children?.photo_url ? (
                                                <img src={record.children.photo_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <Baby className="h-6 w-6 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-base leading-none mb-1">
                                                {record.children?.first_name} {record.children?.last_name}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {record.checked_out_at
                                                        ? `Out: ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                        : `In: ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`}
                                                </p>
                                                {record.children?.allergies && (
                                                    <Badge variant="destructive" className="font-bold text-[9px] h-4">
                                                        Health Alert
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={record.checked_out_at ? "outline" : "default"} className="font-bold text-[10px]">
                                        {record.checked_out_at ? "Away" : "Present"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StaffTeacherDashboard;


