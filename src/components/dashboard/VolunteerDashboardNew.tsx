import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import {
    QrCode, Clock, ChevronRight,
    LogIn, LogOut, AlertTriangle, MessageSquare, Users, Baby,
    Bell, Copy, Check, Printer
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import DashboardShell from "./DashboardShell";

const PAGE_REASONS = [
    "Child needs comfort / inconsolable",
    "Medical / health concern",
    "Diaper / restroom assistance",
    "Parent requested at check-in station"
];

const VolunteerDashboardNew = () => {
    const { unreadCount } = useMessages();
    const navigate = useNavigate();
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

    const { data: todayAttendance = [] } = useQuery({
        queryKey: ["volunteer-attendance-today"],
        queryFn: async () => {
            const { data } = await supabase
                .from("attendance")
                .select("*, children(id, first_name, last_name, allergies, photo_url, family_code, parent_id, parent_name, parent_phone), child:children(id, first_name, last_name, allergies, photo_url, family_code, parent_id, parent_name, parent_phone)")
                .gte("attendance_date", format(startOfDay(new Date()), "yyyy-MM-dd"))
                .lte("attendance_date", format(endOfDay(new Date()), "yyyy-MM-dd"))
                .order("checked_in_at", { ascending: false });
            return data || [];
        },
        refetchInterval: 15000,
    });

    const presentNow = todayAttendance.filter((a: any) => a.checked_in_at && !a.checked_out_at).length;
    const checkedOut = todayAttendance.filter((a: any) => a.checked_out_at).length;
    const allergyAlerts = todayAttendance.filter((a: any) => {
        const childObj = Array.isArray(a.children) ? a.children[0] : (a.children || a.child || {});
        return childObj.allergies && !a.checked_out_at;
    });

    return (
        <DashboardShell
            title="Volunteer Station"
            subtitle={`${format(new Date(), "EEEE, MMMM d")} · Active Check-in / Checkout Terminal`}
            action={
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/messages")}
                    className="h-8 px-2.5 sm:px-3 text-xs gap-1.5"
                >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline sm:inline">Messages</span>
                    {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            }
        >
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-enter animate-enter-1">
                {[
                    { label: "On-site Now", value: presentNow, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
                    { label: "Total Check-ins", value: todayAttendance.length, color: "text-foreground", bg: "bg-muted", dot: "bg-muted-foreground/40" },
                    { label: "Departed", value: checkedOut, color: "text-foreground", bg: "bg-muted", dot: "bg-muted-foreground/40" },
                    { label: "Health Alerts", value: allergyAlerts.length, color: allergyAlerts.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground", bg: allergyAlerts.length > 0 ? "bg-amber-500/10" : "bg-muted", dot: allergyAlerts.length > 0 ? "bg-amber-500" : "bg-muted-foreground/40" },
                ].map((stat) => (
                    <div key={stat.label} className="surface-card p-2 sm:p-4 flex flex-col items-center gap-0.5 sm:gap-1">
                        <div className={cn("h-1.5 w-5 rounded-full", stat.dot)} />
                        <p className={cn("text-xl sm:text-3xl font-extrabold tracking-tight", stat.color)}>{stat.value}</p>
                        <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center truncate w-full">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Main responsive grid: 2 columns on desktop (7 / 5 split) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 items-start">
                {/* Left column: Actions + Medical Alerts */}
                <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                    {/* Primary CTA */}
                    <button
                        onClick={() => navigate("/check-in")}
                        className="w-full group flex items-center justify-between p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-all duration-200 shadow-md hover:shadow-lg animate-enter animate-enter-2"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors shadow-inner flex-shrink-0">
                                <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="font-bold text-sm sm:text-lg leading-tight truncate">Start Check-In Session</p>
                                <p className="text-[11px] sm:text-xs text-amber-100 mt-0.5 sm:mt-1 truncate">Camera scanner & lookup terminal</p>
                            </div>
                        </div>
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 opacity-90 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>

                    {/* Secondary action tiles */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 animate-enter animate-enter-3">
                        <button
                            onClick={() => navigate("/check-out")}
                            className="group surface-card flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 hover:border-border transition-all text-left"
                        >
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-slate-500/10 flex items-center justify-center group-hover:bg-slate-500/15 transition-colors flex-shrink-0">
                                <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] sm:text-[13px] font-semibold leading-none truncate">Departure</p>
                                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">Check-outs</p>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate("/classes")}
                            className="group surface-card flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-4 hover:border-border transition-all text-left"
                        >
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors flex-shrink-0">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] sm:text-[13px] font-semibold leading-none truncate">Class Roster</p>
                                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">Rooms & ratios</p>
                            </div>
                        </button>
                    </div>

                    {/* Medical / allergy alerts card */}
                    {allergyAlerts.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-900/15 p-4 sm:p-5 animate-enter animate-enter-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                        Health Alerts ({allergyAlerts.length} Active On-site)
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                                {allergyAlerts.map((record: any) => {
                                    const childObj = Array.isArray(record.children) ? record.children[0] : (record.children || record.child || {});
                                    const famCode = childObj.family_code || record.family_code;
                                    return (
                                        <div key={record.id} className="flex items-center justify-between bg-card rounded-xl px-3.5 py-2.5 border border-border/80 shadow-xs">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-[13px] font-semibold">
                                                        {childObj.first_name} {childObj.last_name}
                                                    </p>
                                                    {famCode && (
                                                        <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                                            #{famCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                                    {childObj.allergies}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2 text-xs border-primary/25 hover:bg-primary/10 text-primary gap-1 rounded-lg shrink-0 ml-2"
                                                title="Page Family"
                                                onClick={() => {
                                                    setPageDialogItem({
                                                        child_id: childObj.id || record.child_id,
                                                        child_name: `${childObj.first_name} ${childObj.last_name}`.trim(),
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: Session Log (Full height feed) */}
                <div className="lg:col-span-5 space-y-3 animate-enter animate-enter-4">
                    <div className="flex items-center justify-between">
                        <p className="section-label">Realtime Station Activity</p>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Stream
                        </span>
                    </div>

                    <div className="surface-card divide-y divide-border/50 max-h-[460px] overflow-y-auto custom-scrollbar">
                        {todayAttendance.length === 0 ? (
                            <div className="py-8 sm:py-10 flex flex-col items-center text-muted-foreground text-center px-4">
                                <Clock className="h-7 w-7 mb-2 opacity-25" />
                                <p className="text-[13px] font-medium text-foreground">Waiting for station traffic…</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Scanned tags will stream here instantly</p>
                            </div>
                        ) : (
                            todayAttendance.map((record: any) => {
                                const childObj = Array.isArray(record.children) ? record.children[0] : (record.children || record.child || {});
                                const firstName = childObj.first_name || record.child_first_name || "Child";
                                const lastName = childObj.last_name || record.child_last_name || "";
                                const fullName = `${firstName} ${lastName}`.trim();
                                const isPresent = record.checked_in_at && !record.checked_out_at;
                                const famCode = childObj.family_code || record.family_code;
                                return (
                                    <div key={record.id} className="feed-row justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className={cn(
                                                "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold",
                                                isPresent ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
                                            )}>
                                                {isPresent
                                                    ? <LogIn className="h-3.5 w-3.5" />
                                                    : <LogOut className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-[13px] font-semibold leading-none truncate">
                                                        {fullName}
                                                    </p>
                                                    {famCode && (
                                                        <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                                            #{famCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {record.checked_out_at
                                                        ? `Departed ${format(new Date(record.checked_out_at), "HH:mm")}`
                                                        : record.checked_in_at
                                                            ? `Arrived ${format(new Date(record.checked_in_at), "HH:mm")}`
                                                            : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isPresent && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 px-1.5 text-[11px] border-primary/25 hover:bg-primary/10 text-primary gap-1 rounded-md"
                                                    title="Page Family"
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
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Sanctuary Callout Dialog */}
            <Dialog open={!!pageDialogItem} onOpenChange={(open) => !open && setPageDialogItem(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg text-primary">
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
                                            ? "bg-primary/10 border-primary/40 font-semibold text-primary"
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
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
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

export default VolunteerDashboardNew;
