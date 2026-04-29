import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { useTranslation } from "@/lib/i18n";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
    Baby, Clock, Calendar, MessageSquare,
    QrCode, ChevronRight, CheckCircle2,
    Activity, Award, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

const ParentDashboardNew = () => {
    const { user } = useAuth();
    const { unreadCount } = useMessages();
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

    const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dateStr = format(d, "yyyy-MM-dd");
        const checked = recentAttendance.filter((a: any) => a.attendance_date === dateStr).length;
        return { day: format(d, "EEE"), attended: checked };
    });

    const today = format(new Date(), "EEEE, MMMM dd");
    const presentToday = recentAttendance.filter((a: any) =>
        a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
    ).length;

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
                    <p className="text-sm text-muted-foreground">{today} • Family status</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/parent/messages")} variant="default">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 px-1.5 h-5 min-w-[20px] justify-center">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "My Children", value: myChildren.length, icon: Baby, color: "rose" },
                    { label: "Present Today", value: presentToday, icon: CheckCircle2, color: "emerald" },
                    { label: "Reward Points", value: myChildren.reduce((acc: number, curr: any) => acc + (curr.points_balance || 0), 0), icon: Award, color: "amber" },
                    { label: "Notifications", value: unreadCount, icon: MessageSquare, color: "blue" }
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

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Child Management</h2>
                        <Button variant="link" size="sm" onClick={() => navigate("/parent/children")}>
                            Manage all <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map((i) => <div key={i} className="h-32 bg-muted rounded animate-pulse" />)}
                        </div>
                    ) : myChildren.length === 0 ? (
                        <Card className="p-12 text-center shadow-sm border-dashed">
                            <Baby className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-bold">No children linked</h3>
                            <Button onClick={() => navigate("/parent/children")} className="mt-4">
                                Register Child
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {myChildren.map((child: any) => {
                                const childAttendance = recentAttendance.filter((a: any) => a.child_id === child.id);
                                const isAtCenter = childAttendance.some((a: any) =>
                                    a.attendance_date === format(new Date(), "yyyy-MM-dd") && a.checked_in_at && !a.checked_out_at
                                );

                                return (
                                    <Card key={child.id} className="shadow-sm overflow-hidden hover:bg-muted/10 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 rounded border bg-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                                                        {child.first_name?.[0]}{child.last_name?.[0]}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-bold truncate">{child.first_name} {child.last_name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            {isAtCenter ? (
                                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">On-site</Badge>
                                                            ) : (
                                                                <Badge variant="outline">Off-site</Badge>
                                                            )}
                                                            <Badge variant="outline" className="font-medium">{child.points_balance || 0} pts</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <Button variant="outline" size="sm" onClick={() => navigate("/parent/children")} className="flex-1">
                                                        <QrCode className="h-4 w-4 mr-2" /> QR Code
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight">Active Trends</h2>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Attendance Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[160px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="attended" stroke="#0f172a" fill="#0f172a" fillOpacity={0.1} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Access</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Log', icon: Clock, path: "/parent/attendance" },
                                { label: 'Calendar', icon: Calendar, path: "/calendar" },
                                { label: 'Profile', icon: Baby, path: "/parent/children" }, // Adjusted path
                                { label: 'Inbox', icon: MessageSquare, path: "/parent/messages" },
                            ].map((link) => (
                                <Button 
                                    key={link.label}
                                    variant="outline"
                                    className="h-16 flex flex-col gap-1 rounded-lg"
                                    onClick={() => navigate(link.path)}
                                >
                                    <link.icon className="h-4 w-4" />
                                    <span className="text-[10px] font-bold">{link.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboardNew;

