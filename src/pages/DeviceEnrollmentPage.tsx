import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Monitor,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  Printer,
  Tablet,
  Smartphone,
  CheckCircle2,
  Shield,
  Copy,
  Clock,
  Activity,
  AlertTriangle,
  Database,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────
const LS_KEY = "kiddochecker_devices_fallback";

const DEVICE_TYPES = [
  {
    value: "kiosk",
    label: "Check-In Kiosk",
    icon: Monitor,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    value: "tablet",
    label: "Tablet",
    icon: Tablet,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    value: "phone",
    label: "Mobile Phone",
    icon: Smartphone,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    value: "printer",
    label: "Label Printer",
    icon: Printer,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "badge-success",
  pending: "badge-warning",
  offline: "badge-danger",
  revoked: "bg-slate-100 text-slate-500",
  secure: "badge-success",
  flagged: "bg-amber-100 text-amber-700 border-amber-200",
  locked: "bg-red-100 text-red-700 border-red-200",
};

// ─── Utilities ────────────────────────────────────────────────
const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    (_, i) =>
      (i === 3 ? "-" : "") + chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

// ─── Types ────────────────────────────────────────────────────
interface DeviceRow {
  id: string;
  name: string;
  type: string;
  location?: string | null;
  enrollment_code: string;
  status: string;
  security_status?: string;
  enrolled_by?: string | null;
  last_seen?: string | null;
  last_ip?: string | null;
  os_info?: string | null;
  browser_info?: string | null;
  device_info?: any;
  enrolled_at: string;
  revoked_at?: string | null;
  notes?: string | null;
  failure_count?: number;
  serial_number?: string | null;
}

interface FormState {
  name: string;
  type: string;
  location: string;
  notes: string;
  serial_number: string;
}

// ─── Helpers: localStorage fallback
const lsLoad = (): DeviceRow[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
};
const lsSave = (d: DeviceRow[]) =>
  localStorage.setItem(LS_KEY, JSON.stringify(d));

// ─── Component ────────────────────────────────────────────────
const DeviceEnrollmentPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null); // null = checking
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [enrollCode, setEnrollCode] = useState(generateCode());
  const [form, setForm] = useState<FormState>({
    name: "",
    type: "kiosk",
    location: "",
    notes: "",
    serial_number: "",
  });
  // fallback local devices (when DB unavailable)
  const [localDevices, setLocalDevices] = useState<DeviceRow[]>(lsLoad);

  // ── Probe DB availability ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { error } = await supabase
          .from("enrolled_devices" as any)
          .select("id")
          .limit(1);
        setDbAvailable(!error || error.code !== "42P01"); // 42P01 = table_not_found
      } catch {
        setDbAvailable(false);
      }
    })();
  }, []);

  // ── Queries ────────────────────────────────────────────────────────
  const { data: dbDevices = [], isLoading } = useQuery<DeviceRow[]>({
    queryKey: ["enrolled_devices"],
    enabled: dbAvailable === true,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrolled_devices")
        .select("*")
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeviceRow[];
    },
  });

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["device_activity_log"],
    enabled: dbAvailable === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_activity_log")
        .select("*, enrolled_devices(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const devices = dbAvailable ? dbDevices : localDevices;

  // ── Mutations ────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (payload: Omit<DeviceRow, "id">) => {
      if (!dbAvailable) {
        const rec: DeviceRow = { id: uuidv4(), ...payload };
        const updated = [rec, ...localDevices];
        setLocalDevices(updated);
        lsSave(updated);
        return rec;
      }
      const { data, error } = await supabase
        .from("enrolled_devices" as any)
        .insert([{ ...payload, enrolled_by: user?.id }])
        .select()
        .single();
      if (error) throw error;
      // Log activity
      await supabase.from("device_activity_log" as any).insert([
        {
          device_id: (data as any).id,
          action: "enrolled",
          performed_by: user?.id,
          metadata: { type: payload.type, name: payload.name },
        },
      ]);
      return data as unknown as DeviceRow;
    },
    onSuccess: (dev) => {
      qc.invalidateQueries({ queryKey: ["enrolled_devices"] });
      setShowAdd(false);
      setForm({ name: "", type: "kiosk", location: "", notes: "", serial_number: "" });
      setEnrollCode(generateCode());
      toast({
        title: "Device enrolled!",
        description: `${dev.name} is now active.`,
      });
    },
    onError: (e: any) =>
      toast({
        title: "Enrollment failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!dbAvailable) {
        const updated = localDevices.map((d) =>
          d.id === id
            ? { ...d, status: "revoked", revoked_at: new Date().toISOString() }
            : d,
        );
        setLocalDevices(updated);
        lsSave(updated);
        return;
      }
      const { error } = await supabase
        .from("enrolled_devices")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id,
        })
        .eq("id", id);
      if (error) throw error;
      await supabase.from("device_activity_log").insert([
        {
          device_id: id,
          action: "revoked",
          performed_by: user?.id,
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrolled_devices"] });
      setRevokeId(null);
      toast({
        title: "Device revoked",
        description: "Access has been revoked permanently.",
      });
    },
    onError: (e: any) =>
      toast({
        title: "Error revoking device",
        description: e.message,
        variant: "destructive",
      }),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("enrolled_devices")
        .update({
          security_status: "secure",
          failure_count: 0,
          locked_until: null,
        })
        .eq("id", id);
      if (error) throw error;

      await supabase.from("device_activity_log").insert([
        {
          device_id: id,
          action: "unlocked",
          performed_by: user?.id,
          metadata: { reason: "Admin manual unlock" }
        },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrolled_devices"] });
      toast({ title: "Device unlocked", description: "Security status reset to secure." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!dbAvailable) {
        const updated = localDevices.filter((d) => d.id !== id);
        setLocalDevices(updated);
        lsSave(updated);
        return;
      }
      const { error } = await supabase
        .from("enrolled_devices" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrolled_devices"] });
      setDeleteId(null);
      toast({ title: "Device removed" });
    },
    onError: (e: any) =>
      toast({
        title: "Error removing device",
        description: e.message,
        variant: "destructive",
      }),
  });

  const handleEnroll = () => {
    if (!form.name.trim()) {
      toast({ title: "Device name required", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      name: form.name,
      type: form.type,
      location: form.location || null,
      enrollment_code: enrollCode,
      status: "active",
      security_status: "secure",
      enrolled_by: user?.id || null,
      enrolled_at: new Date().toISOString(),
      notes: form.notes || null,
      serial_number: form.serial_number || null,
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(enrollCode);
    toast({ title: "Code copied to clipboard" });
  };

  // ── Derived ────────────────────────────────────────────────────
  const devicesByType = DEVICE_TYPES.map((dt) => ({
    ...dt,
    devices: devices.filter((d) => d.type === dt.value),
    count: devices.filter((d) => d.type === dt.value).length,
  }));

  const activeCount = devices.filter((d) => d.status === "active").length;
  const revokedCount = devices.filter((d) => d.status === "revoked").length;

  // ── Render ────────────────────────────────────────────────────
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Monitor className="h-8 w-8 text-indigo-600" />
                Device Enrollment
              </h1>
              <p className="text-slate-500 mt-1">
                Securely manage kiosks, tablets, phones, and printers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* DB status indicator */}
              {dbAvailable === true && (
                <Badge className="badge-success gap-1.5 px-3 py-1.5">
                  <Database className="h-3 w-3" /> DB Secured
                </Badge>
              )}
              {dbAvailable === false && (
                <Badge
                  className="badge-warning gap-1.5 px-3 py-1.5"
                  title="Run the Supabase migration to enable DB storage"
                >
                  <AlertTriangle className="h-3 w-3" /> Local Fallback
                </Badge>
              )}
              <Button
                onClick={() => {
                  setEnrollCode(generateCode());
                  setShowAdd(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2"
              >
                <Plus className="h-4 w-4" /> Enroll Device
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Migration notice */}
        {dbAvailable === false && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  Database migration required for full security
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Device data is currently in your browser's localStorage. Run
                  the Supabase migration to store devices in the database with
                  full audit logging.
                </p>
                <code className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded mt-2 inline-block font-mono">
                  supabase/migrations/20260224_create_devices_table.sql
                </code>
              </div>
            </div>
          </motion.div>
        )}

        {/* KPI Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Devices",
                value: devices.length,
                icon: Monitor,
                c: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Active Now",
                value: activeCount,
                icon: CheckCircle2,
                c: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Kiosks",
                value: devices.filter((d) => d.type === "kiosk").length,
                icon: QrCode,
                c: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Revoked",
                value: revokedCount,
                icon: Shield,
                c: "text-red-600",
                bg: "bg-red-50",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-2xl p-5 shadow-sm border border-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {s.label}
                    </p>
                  </div>
                  <div className={`${s.bg} rounded-xl p-2.5`}>
                    <s.icon className={`h-5 w-5 ${s.c}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enrollment Guide */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" /> Enrollment Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Register Device",
                  desc: "Click 'Enroll Device' to generate a secure Reference Code for your new terminal.",
                },
                {
                  step: "2",
                  title: "Activate Terminal",
                  desc: "Navigate to /device-login on the tablet/kiosk and enter the Reference Code + Master PIN.",
                },
                {
                  step: "3",
                  title: "Lock to Kiosk",
                  desc: "The device will securely authorize and lock into the immersive Check-In interface.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-3 bg-card/60 rounded-xl p-4"
                >
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-indigo-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Direct Activation URL</p>
                <div className="flex items-center gap-2">
                  <code className="bg-white/80 border border-indigo-100 px-3 py-1.5 rounded-lg text-sm font-mono font-bold text-indigo-700">
                    {window.location.origin}/device-login
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-indigo-400"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/device-login`);
                      toast({ title: "URL Copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/50 px-3 py-2 rounded-xl border border-indigo-50">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Devices must be authorized via Reference Code before accessing check-in.</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Device list (tabs by type) */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="mb-4 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="inventory" className="rounded-lg px-6">Device Inventory</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-6 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            {(isLoading && dbAvailable) || dbAvailable === null ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-slate-200">
                <Monitor className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">No devices enrolled yet</h3>
                <Button
                  onClick={() => { setEnrollCode(generateCode()); setShowAdd(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 mt-4"
                >
                  <Plus className="h-4 w-4" /> Enroll First Device
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {devicesByType.map((typeGroup, gi) => {
                  if (typeGroup.count === 0) return null;
                  const Icon = typeGroup.icon;
                  return (
                    <motion.div key={typeGroup.value}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${typeGroup.bg} rounded-xl p-2`}><Icon className={`h-4 w-4 ${typeGroup.color}`} /></div>
                        <h3 className="font-bold text-foreground tracking-tight">{typeGroup.label}s</h3>
                        <Badge variant="outline">{typeGroup.count}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {typeGroup.devices.map((device) => (
                          <motion.div key={device.id} whileHover={{ y: -4 }} className="bg-card rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`${typeGroup.bg} rounded-2xl p-3`}><Icon className={`h-6 w-6 ${typeGroup.color}`} /></div>
                                <div>
                                  <p className="font-bold text-foreground leading-tight">{device.name}</p>
                                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{device.location || "No Location"}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <Badge variant="outline" className={`text-xs ${STATUS_COLORS[device.status] || ""}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${device.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                  {device.status}
                                </Badge>
                                {device.security_status && device.security_status !== 'secure' && (
                                  <Badge className={STATUS_COLORS[device.security_status]}>
                                    <AlertTriangle className="h-3 w-3 mr-1" /> {device.security_status}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2.5 text-[12px] bg-slate-50/50 rounded-2xl p-4 mb-5 border border-slate-50">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Reference:</span>
                                <span className="font-mono font-bold text-indigo-600">{device.enrollment_code}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Hardware:</span>
                                <span className={cn("text-slate-700 font-medium truncate max-w-[120px]", !device.os_info && "text-slate-400 italic font-normal")}>
                                  {device.os_info || "Waiting for first login..."}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Serial No:</span>
                                <span className="text-slate-700 font-medium truncate max-w-[120px]">
                                  {device.serial_number || "None"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">

                                <span className="text-slate-400">Last IP:</span>
                                <span className="text-slate-700 font-medium">{device.last_ip || "N/A"}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
                                <span className="text-slate-400">Activity:</span>
                                <span className="text-slate-500">{device.last_seen ? format(new Date(device.last_seen), 'MMM dd, HH:mm') : "Never"}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {device.security_status !== 'secure' && (
                                <Button
                                  size="sm"
                                  onClick={() => unlockMutation.mutate(device.id)}
                                  className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 rounded-xl text-xs h-9"
                                >
                                  Unlock
                                </Button>
                              )}
                              {device.status !== "revoked" && (
                                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-9 text-amber-600 border-amber-200" onClick={() => setRevokeId(device.id)}>Revoke</Button>
                              )}
                              <Button size="sm" variant="outline" className="px-3 rounded-xl h-9 text-red-500 border-red-100 hover:bg-red-50" onClick={() => setDeleteId(device.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="bg-card rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-bold text-foreground">Recent Security Activity</h3>
                <p className="text-xs text-slate-500">Full audit trail of terminal authorizations and alerts</p>
              </div>
              <div className="divide-y divide-slate-50">
                {activityLogs.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">No security events found.</div>
                ) : activityLogs.map((log: any) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${log.action === 'security_alert' ? 'bg-red-50 text-red-600' : log.action === 'terminal_activated' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {log.action === 'security_alert' ? <AlertTriangle className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 capitalize">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-500">
                          {log.enrolled_devices?.name || "System"} • {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.metadata?.reason && (
                        <Badge variant="outline" className="text-[10px] bg-red-50/50 text-red-500 border-red-100">{log.metadata.reason}</Badge>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{log.metadata?.client_ip || log.metadata?.ip || "unknown ip"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Enroll Dialog ───────────────────────────────────────────── */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" /> Enroll New Device
              </DialogTitle>
              <DialogDescription>
                Add a new authorized device to your organization records with a
                secure reference code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Code display */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 text-center border border-indigo-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Secure Device Reference Code
                </p>
                <p className="text-4xl font-bold tracking-[0.18em] text-indigo-700 font-mono">
                  {enrollCode}
                </p>
                <div className="flex gap-2 mt-3 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEnrollCode(generateCode())}
                    className="rounded-xl text-xs gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCode}
                    className="rounded-xl text-xs gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Store this code securely to identify the device
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Device Name *
                  </Label>
                  <Input
                    placeholder="e.g. Main Lobby Kiosk"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Device Type
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          <div className="flex items-center gap-2">
                            <dt.icon className="h-4 w-4" /> {dt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Serial Number / Asset ID
                  </Label>
                  <Input
                    placeholder="e.g. SN-99228811"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Location (optional)
                  </Label>
                  <Input
                    placeholder="e.g. Nursery, Room 1, Lobby"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Notes (optional)
                  </Label>
                  <Input
                    placeholder="e.g. iPad model, responsible staff, etc."
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="rounded-xl flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={addMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl flex-1 gap-2"
              >
                {addMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Enroll Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Revoke Confirm ─────────────────────────────────────────── */}
        <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Device Access?</AlertDialogTitle>
              <AlertDialogDescription>
                The device will immediately lose access to the system. This
                action is logged for accountability. The device record will
                remain in the audit trail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-amber-600 hover:bg-amber-700 rounded-xl"
                onClick={() => revokeId && revokeMutation.mutate(revokeId)}
              >
                Revoke Access
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Delete Confirm ─────────────────────────────────────────── */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Remove Device?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the device record and all
                associated audit logs. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 rounded-xl"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default DeviceEnrollmentPage;


