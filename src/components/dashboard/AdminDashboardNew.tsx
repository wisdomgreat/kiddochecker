import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { cn } from '@/lib/utils';
import { 
    Users, 
    Baby, 
    Calendar, 
    Shield, 
    MessageSquare, 
    TrendingUp, 
    Clock, 
    Activity, 
    UserCheck,
    ChevronRight,
    Monitor,
    Globe,
    BarChart3,
    Settings,
    QrCode,
    Printer,
    LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useSettings } from "@/hooks/useSettings";

// Charting colors using semantic HSL tokens for perfect theme blending
const CHART_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--destructive))",
    "hsl(var(--primary) / 0.5)"
];

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
            if (error) return [];
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
                days.push({ day: format(d, "EEE"), checkins: count || 0 });
            }
            return days;
        },
    });

    const { data: messagesCount = 0 } = useQuery({
        queryKey: ["dashboard-unread-messages-count", user?.id],
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

    const presentNow = attendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const totalCheckins = attendance.length;
    const checkedOutToday = totalCheckins - presentNow;

    const pieData = [
        { name: 'Present', value: presentNow },
        { name: 'Away', value: Math.max(0, children.length - presentNow) },
    ];

    const quickActions = [
        { title: 'Check-in Kiosk', icon: QrCode, path: "/check-in" },
        { title: 'QR Labels', icon: Printer, path: "/qr-management" },
        { title: 'Schedules', icon: Calendar, path: "/staff/schedules" },
        { title: 'Users', icon: Users, path: "/users" },
        { title: 'Devices', icon: Monitor, path: "/devices" },
        { title: 'Reports', icon: BarChart3, path: "/reports" },
        { title: 'Settings', icon: Settings, path: "/settings" },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">{today} • {totalCheckins} check-ins recorded</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/check-in")} className="h-10">
                        <QrCode className="h-4 w-4 mr-2" />
                        Launch Kiosk
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Enrolled Registry", value: children.length, icon: Baby, color: "blue", trend: "+2 this week" },
                    { label: "Active Sessions", value: totalCheckins, icon: UserCheck, color: "emerald", trend: "Live Tracking" },
                    { label: "Duty Staff", value: staff.length, icon: Shield, color: "slate", trend: "All Cleared" },
                    { label: "System Alerts", value: messagesCount, icon: MessageSquare, color: "amber", trend: messagesCount > 0 ? "Action Required" : "No Alerts" }
                ].map((stat) => (
                    <Card key={stat.label} className="group hover:shadow-xl transition-all border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                                    <h3 className="text-4xl font-black tracking-tighter leading-none">{stat.value}</h3>
                                    <p className={cn(
                                      "text-[9px] font-bold uppercase tracking-widest mt-3",
                                      stat.label === "System Alerts" && messagesCount > 0 ? "text-amber-500" : "text-muted-foreground/60"
                                    )}>{stat.trend}</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
                        <CardDescription>Records from the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyAttendance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: "hsl(var(--card))", 
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "var(--radius)",
                                            fontSize: "12px"
                                        }} 
                                    />
                                    <Area type="monotone" dataKey="checkins" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.05} strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">On-site Status</CardTitle>
                        <CardDescription>Current check-in ratio</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-6">
                            {pieData.map((item, i) => (
                                <div key={item.name} className="p-3 bg-muted/50 rounded border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.name}</p>
                                    <p className="text-xl font-bold">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Quick Management</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {quickActions.map((action) => (
                        <Button 
                            key={action.title}
                            variant="outline" 
                            className="h-24 flex flex-col gap-2 rounded-lg hover:bg-muted"
                            onClick={() => navigate(action.path)}
                        >
                            <action.icon className="h-5 w-5" />
                            <span className="text-xs font-bold">{action.title}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight">Recent Check-ins</h2>
                    <Button variant="link" size="sm" onClick={() => navigate("/attendance")}>
                        View all records <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <div className="divide-y">
                        {attendance.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No activity today</p>
                            </div>
                        ) : (
                            attendance.slice(0, 5).map((record: any) => (
                                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                            {record.children?.photo_url ? (
                                                <img src={record.children.photo_url} className="h-full w-full object-cover" />
                                            ) : (
                                                <Baby className="h-5 w-5 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">
                                                {record.children?.first_name} {record.children?.last_name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                <Clock className="h-3 w-3" />
                                                {record.checked_out_at
                                                    ? `Departure: ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                    : `Arrival: ${record.checked_in_at ? format(new Date(record.checked_in_at), "HH:mm") : "—"}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={record.checked_out_at ? "secondary" : "default"} className="font-bold text-[10px]">
                                        {record.checked_out_at ? "Checked out" : "On-site"}
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

export default AdminDashboardNew;


