import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
    CheckCircle2, XCircle, ClipboardCheck, AlertTriangle,
    Clock, BookOpen, MessageSquare, QrCode, ChevronRight,
    Activity, Baby, Printer, Bell, Copy, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import DashboardShell from "./DashboardShell";
import NameTagPrintDialog from "@/components/kiosk/NameTagPrintDialog";

const PAGE_REASONS = [
    "Child needs comfort / inconsolable",
    "Medical / health concern",
    "Diaper / restroom assistance",
    "Parent requested early pickup"
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{payload[0].value} children</p>
        </div>
    );
};

const StaffTeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reprintChild, setReprintChild] = React.useState<any>(null);
    const [reprintCode, setReprintCode] = React.useState<string>("");
    const [pageDialogItem, setPageDialogItem] = React.useState<any>(null);
    const [pageReason, setPageReason] = React.useState<string>("Child needs comfort / inconsolable");
    const [isPaging, setIsPaging] = React.useState(false);
    const [copiedPager, setCopiedPager] = React.useState(false);

    const handleTriggerSanctuaryPage = async () => {
        if (!pageDialogItem?.family_code) {
            toast.error("No family sanctuary code found for this child.");
            return;
        }
        setIsPaging(true);
        try {
            await apiFetch('/api/sanctuary/page', {
                method: 'POST',
                body: JSON.stringify({
                    family_code: pageDialogItem.family_code,
                    child_id: pageDialogItem.child_id,
                    child_name: pageDialogItem.child_name,
                    reason: pageReason
                })
            });
            toast.success(`Sanctuary Callout triggered for Family ${pageDialogItem.family_code}! Alert logged.`);
            setPageDialogItem(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger sanctuary callout");
        } finally {
            setIsPaging(false);
        }
    };

    const { data: myClasses = [] } = useQuery({
        queryKey: ["staff-my-classes", user?.id],
        queryFn: async () => {
            const { data } = await supabase.from("classes").select("*").limit(10);
            return data || [];
        },
        enabled: !!user?.id,
    });

    const { data: todayAttendance = [] } = useQuery({
        queryKey: ["staff-today-attendance"],
        queryFn: async () => {
            const { data } = await supabase
                .from("attendance")
                .select("*, children(first_name, last_name, age, allergies, photo_url, parent_id, family_code, parent_name, parent_phone), child:children(first_name, last_name, age, allergies, photo_url, parent_id, family_code, parent_name, parent_phone)")
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
    const allergyAlerts = todayAttendance.filter((a: any) => a.children?.allergies && !a.checked_out_at).length;

    const hourlyData = Array.from({ length: 10 }, (_, i) => {
        const hour = i + 7;
        const count = todayAttendance.filter((a: any) => {
            if (!a.checked_in_at) return false;
            return new Date(a.checked_in_at).getHours() === hour;
        }).length;
        return { hour: `${hour}:00`, count };
    });

    const stats = [
        {
            label: "Present Now",
            value: presentNow,
            icon: CheckCircle2,
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            trend: "On-site",
        },
        {
            label: "Checked Out",
            value: checkedOut,
            icon: XCircle,
            iconBg: "bg-slate-500/10",
            iconColor: "text-slate-400",
            trend: "Departed today",
        },
        {
            label: "Total Entries",
            value: todayAttendance.length,
            icon: ClipboardCheck,
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            trend: "All check-ins",
        },
        {
            label: "Health Alerts",
            value: allergyAlerts,
            icon: AlertTriangle,
            iconBg: allergyAlerts > 0 ? "bg-amber-500/10" : "bg-muted",
            iconColor: allergyAlerts > 0 ? "text-amber-500" : "text-muted-foreground",
            trend: allergyAlerts > 0 ? "Active now" : "All clear",
        },
    ];

    return (
        <DashboardShell
            title="Staff Overview"
            subtitle={`${format(new Date(), "EEEE, MMMM d")} · Signed in as ${user?.email}`}
            action={
                <Button size="sm" onClick={() => navigate("/messages")} className="gap-2" variant="outline">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Inbox
                    {messagesCount > 0 && (
                        <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                            {messagesCount}
                        </span>
                    )}
                </Button>
            }
        >
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={stat.label} className={cn("kpi-card animate-enter", `animate-enter-${i + 1}`)}>
                        <div className={cn("kpi-icon", stat.iconBg)}>
                            <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="kpi-label">{stat.label}</p>
                            <p className="kpi-value">{stat.value}</p>
                            <p className="kpi-trend">{stat.trend}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts + Classes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-enter animate-enter-3">
                {/* Bar chart - arrival flow */}
                <div className="surface-card lg:col-span-2">
                    <div className="px-5 pt-5 pb-3 border-b border-border/50">
                        <p className="font-semibold text-[14px]">Arrival Flow</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Children checked in by hour</p>
                    </div>
                    <div className="p-5 h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={18}>
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,9%,46%)" }} allowDecimals={false} />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                                    {hourlyData.map((_, i) => (
                                        <Cell key={i} fill={`hsl(152,69%,${Math.max(42, 62 - i * 2)}%)`} opacity={0.85} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Classes panel */}
                <div className="surface-card">
                    <div className="px-5 pt-5 pb-3 border-b border-border/50">
                        <p className="font-semibold text-[14px]">Assigned Classes</p>
                    </div>
                    <div className="divide-y divide-border/50 max-h-[260px] overflow-y-auto custom-scrollbar">
                        {myClasses.length === 0 ? (
                            <div className="py-8 flex flex-col items-center text-muted-foreground">
                                <BookOpen className="h-6 w-6 mb-2 opacity-25" />
                                <p className="text-[12px] font-medium">No active classes</p>
                            </div>
                        ) : (
                            myClasses.map((cls: any) => (
                                <button
                                    key={cls.id}
                                    onClick={() => navigate("/classes")}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold leading-none">{cls.name}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{cls.room || "No room"}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Live feed */}
            <div className="animate-enter animate-enter-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Real-time Feed</p>
                    <button
                        onClick={() => navigate("/attendance")}
                        className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        Full logs <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="surface-card divide-y divide-border/50 max-h-[420px] overflow-y-auto custom-scrollbar">
                    {todayAttendance.length === 0 ? (
                        <div className="py-8 sm:py-10 flex flex-col items-center text-muted-foreground">
                            <Activity className="h-7 w-7 mb-2 opacity-25" />
                            <p className="text-sm font-medium">Waiting for check-ins…</p>
                        </div>
                    ) : (
                        todayAttendance.map((record: any) => {
                            const childObj = Array.isArray(record.children) ? record.children[0] : (record.children || record.child || {});
                            const firstName = childObj.first_name || record.child_first_name || record.child_name || "Child";
                            const lastName = childObj.last_name || record.child_last_name || "";
                            const fullName = `${firstName} ${lastName}`.trim();
                            const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
                            const isPresent = record.checked_in_at && !record.checked_out_at;
                            const famCode = childObj.family_code || record.family_code;
                            return (
                                <div key={record.id} className="feed-row justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="feed-avatar">
                                            {childObj.photo_url ? (
                                                <img src={childObj.photo_url} className="h-full w-full object-cover" alt="" />
                                            ) : initials || <Baby className="h-4 w-4 opacity-40" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-[13px] font-semibold leading-none">
                                                    {fullName}
                                                </p>
                                                {famCode && (
                                                    <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 tracking-wider">
                                                        #{famCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {record.checked_out_at
                                                        ? `Left ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                        : record.checked_in_at
                                                            ? `Arrived ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                            : "—"}
                                                </p>
                                                {childObj.allergies && (
                                                    <span className="badge-warning">Health alert</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                            isPresent
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {isPresent ? "Present" : "Left"}
                                        </span>
                                        {isPresent && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs border-rose-500/20 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1 rounded-lg"
                                                title="Page Family to Sanctuary"
                                                onClick={() => {
                                                    setPageDialogItem({
                                                        child_id: childObj.id || record.child_id,
                                                        child_name: fullName,
                                                        family_code: famCode,
                                                        parent_name: childObj.parent_name,
                                                        parent_phone: childObj.parent_phone
                                                    });
                                                    setCopiedPager(false);
                                                }}
                                            >
                                                <Bell className="h-3 w-3" />
                                                <span className="hidden sm:inline">Page</span>
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7 text-muted-foreground hover:text-primary border-border"
                                            title="Reprint Name Tag"
                                            onClick={() => {
                                                setReprintChild(childObj);
                                                setReprintCode(record.security_code || record.id.slice(0, 4).toUpperCase());
                                            }}
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {reprintChild && (
                <NameTagPrintDialog
                    open={!!reprintChild}
                    onClose={() => setReprintChild(null)}
                    child={reprintChild}
                    securityCode={reprintCode}
                    className={reprintChild.assigned_class || "General"}
                />
            )}

            {/* Sanctuary Callout Dialog */}
            <Dialog open={!!pageDialogItem} onOpenChange={(open) => !open && setPageDialogItem(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-rose-600 dark:text-rose-400">
                            <Bell className="h-5 w-5" />
                            Sanctuary Callout / Parent Pager
                        </DialogTitle>
                        <DialogDescription className="text-left text-sm pt-1">
                            Flash family pager code onto church sanctuary projector screen to alert parent.
                        </DialogDescription>
                    </DialogHeader>

                    {/* High-visibility Projector Card */}
                    <div className="bg-slate-950 text-white rounded-2xl p-5 text-center shadow-lg border border-slate-800 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sanctuary Screen Projection</p>
                        <div className="font-mono text-4xl font-black tracking-widest text-amber-400 py-1">
                            {pageDialogItem?.family_code || "CODE"}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Displayed on projector as: <strong className="text-white">PAGER # {pageDialogItem?.family_code || "CODE"}</strong>
                        </p>
                    </div>

                    {/* Family Details */}
                    <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1.5 border border-border/70">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground font-medium">Child:</span>
                            <span className="font-semibold">{pageDialogItem?.child_name}</span>
                        </div>
                        {pageDialogItem?.parent_name && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Parent:</span>
                                <span className="font-semibold">{pageDialogItem.parent_name}</span>
                            </div>
                        )}
                        {pageDialogItem?.parent_phone && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-medium">Phone:</span>
                                <span className="font-semibold">{pageDialogItem.parent_phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Callout Reason */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Callout Reason</label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {PAGE_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    type="button"
                                    onClick={() => setPageReason(reason)}
                                    className={cn(
                                        "text-left text-xs px-3 py-2 rounded-lg border transition-all",
                                        pageReason === reason
                                            ? "bg-rose-500/10 border-rose-500/40 font-semibold text-rose-700 dark:text-rose-300"
                                            : "border-border hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-xs gap-1.5"
                            onClick={() => {
                                navigator.clipboard.writeText(`PAGER # ${pageDialogItem?.family_code}`);
                                setCopiedPager(true);
                                toast.success(`Copied "PAGER # ${pageDialogItem?.family_code}" for ProPresenter!`);
                                setTimeout(() => setCopiedPager(false), 2000);
                            }}
                        >
                            {copiedPager ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedPager ? "Copied" : "Copy Projector Text"}
                        </Button>
                        <Button
                            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
                            disabled={isPaging}
                            onClick={handleTriggerSanctuaryPage}
                        >
                            {isPaging ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                            Trigger Sanctuary Alert
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
};

export default StaffTeacherDashboard;
