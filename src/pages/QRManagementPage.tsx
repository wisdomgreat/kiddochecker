import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import {
    Printer, QrCode, Search, Download, Baby, Filter, Grid3X3,
    List, ChevronDown, AlertTriangle, CheckCircle2, Phone,
    RefreshCw, Settings, X, Eye, BookOpen, Loader2, ShieldAlert
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import useQRCodes from "@/hooks/useQRCodes";
import { QRService } from "@/services/QRService";

interface Child {
    id: string;
    first_name: string;
    last_name: string;
    age: number;
    allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    class_id?: string;
    parent_id?: string;
}

const QR_SIZE = 160;

interface QRLabelProps {
    child: Child & { class?: { name: string } };
    orgName?: string;
    useToken?: boolean;
    tokenData?: string;
}

const QRLabel = ({ child, orgName = "KiddoChecker", useToken = false, tokenData }: QRLabelProps) => {
    const jsonQR = JSON.stringify({
        type: "CHILD_CHECKIN",
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        v: 1,
    });

    const qrData = (useToken && tokenData) ? tokenData : jsonQR;

    return (
        <div className="qr-print-label bg-card border-2 border-slate-800 rounded-xl p-4 w-[240px] text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{orgName}</p>
            <div className="bg-card inline-block p-2 border border-slate-200 rounded-lg">
                <QRCodeSVG value={qrData} size={QR_SIZE} level="H" includeMargin={false} />
            </div>
            <p className="font-bold text-foreground text-base mt-2 leading-tight">{child.first_name} {child.last_name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
                {child.age && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{child.age} yrs</p>}
                {(child as any).class?.name && (
                    <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-bold uppercase px-2 py-0">{(child as any).class.name}</Badge>
                )}
            </div>
            {child.allergies && (
                <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-tighter">⚠ Allergy Alert</p>
                    <p className="text-sm text-amber-900 font-bold leading-tight uppercase">{child.allergies}</p>
                </div>
            )}
            {child.emergency_contact_phone && (
                <p className="text-[9px] text-slate-500 mt-1.5">📞 {child.emergency_contact_phone}</p>
            )}
            <p className="text-[8px] text-slate-400 mt-1 font-mono">{child.id.substring(0, 12).toUpperCase()}</p>
        </div>
    );
};

const QRManagementPage = () => {
    const { isAdmin, isSuperAdmin } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
    const [isPrinting, setIsPrinting] = useState(false);
    const [qrSourceType, setQrSourceType] = useState<"standard" | "token">("standard");
    const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [isSavingCode, setIsSavingCode] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { qrCodes, generateQRCode, isLoading: qrLoading } = useQRCodes();

    const getChildToken = (childId: string) => {
        return qrCodes?.find(q => q.child_id === childId)?.qr_data;
    };

    const handleSetManualCode = async () => {
        if (!selectedChild || !manualCode.trim()) return;
        setIsSavingCode(true);
        try {
            await supabase.from('qr_codes').update({ is_active: false }).eq('child_id', selectedChild.id);
            const { error } = await supabase.from('qr_codes').insert({
                child_id: selectedChild.id,
                qr_data: manualCode.trim(),
                is_active: true
            });
            if (error) throw error;
            toast({ title: "Success", description: "QR Code set manually. Kiosk will now recognize this code." });
            setQrSourceType("token");
            setIsRegenDialogOpen(false);
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSavingCode(false);
        }
    };

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            const result = await QRService.syncAllChildren();
            if (result.success) {
                toast({ title: "Sync Complete", description: `Generated ${result.count} new tokens for children missing them.` });
                setQrSourceType("token");
            }
        } catch (err: any) {
            toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRegenerateAll = async () => {
        if (!window.confirm("CRITICAL WARNING: This will DEACTIVATE all existing QR codes. Any labels you have already printed will no longer scan. Are you sure you want to proceed?")) return;
        
        setIsSyncing(true);
        try {
            const result = await QRService.regenerateAll();
            if (result.success) {
                toast({ title: "Nuclear Reset Complete", description: `Deactivated all old codes and generated ${result.count} fresh tokens.` });
                setQrSourceType("token");
            }
        } catch (err: any) {
            toast({ title: "Reset Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isAdmin && !isSuperAdmin) {
        return (
            <UnifiedDashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card rounded-3xl border border-slate-100 shadow-sm m-6">
                    <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
                        <ShieldAlert className="h-10 w-10 text-rose-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
                    <p className="text-slate-500 max-w-md font-medium text-lg italic">
                        "For the safety and confidentiality of our children, QR label generation is restricted to administrative accounts only."
                    </p>
                </div>
            </UnifiedDashboardLayout>
        );
    }

    const { data: children = [], isLoading: childrenLoading } = useQuery({
        queryKey: ["qr-children"],
        queryFn: async () => {
            const { data } = await supabase.from("children").select("*, class:classes(name)").order("first_name");
            return (data || []) as any[];
        },
    });

    const { data: classes = [] } = useQuery({
        queryKey: ["qr-classes"],
        queryFn: async () => {
            const { data } = await supabase.from("classes").select("id, name");
            return data || [];
        },
    });

    const filtered = children.filter((c) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase());
        const matchClass = filterClass === "all" || c.class_id === filterClass;
        return matchSearch && matchClass;
    });

    const toggleSelect = (id: string) => {
        const next = new Set(selectedChildren);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedChildren(next);
    };

    const selectAll = () => {
        if (selectedChildren.size === filtered.length) {
            setSelectedChildren(new Set());
        } else {
            setSelectedChildren(new Set(filtered.map((c) => c.id)));
        }
    };

    const handlePrint = () => {
        const toPrint = selectedChildren.size > 0
            ? children.filter((c) => selectedChildren.has(c.id))
            : filtered;

        if (toPrint.length === 0) return;
        setIsPrinting(true);

        setTimeout(() => {
            const printWindow = window.open("", "_blank", "width=900,height=700");
            if (!printWindow) { setIsPrinting(false); return; }

            const labelsHTML = toPrint.map((child) => {
                const safeFirstName = DOMPurify.sanitize(child.first_name);
                const safeLastName = DOMPurify.sanitize(child.last_name);
                const safeAllergies = child.allergies ? DOMPurify.sanitize(child.allergies) : '';

                const jsonQR = JSON.stringify({ type: "CHILD_CHECKIN", id: child.id, name: `${safeFirstName} ${safeLastName}`, v: 1 });
                const token = getChildToken(child.id);
                const qrVal = (qrSourceType === "token" && token) ? token : jsonQR;

                return `
          <div class="label">
            <p class="org">KiddoChecker</p>
            <div class="qr-placeholder" data-value="${encodeURIComponent(qrVal)}"></div>
            <p class="name">${safeFirstName} ${safeLastName}</p>
            <div style="display: flex; justify-items: center; justify-content: center; gap: 8px; margin-top: 4px;">
              <p class="age">${child.age ? child.age + "y" : ""}</p>
              ${(child as any).class?.name ? `<p class="class-label">${(child as any).class.name}</p>` : ""}
            </div>
            ${safeAllergies ? `<div class="allergy">⚠ ${safeAllergies}</div>` : ""}
            ${child.emergency_contact_phone ? `<p class="phone">📞 ${DOMPurify.sanitize(child.emergency_contact_phone)}</p>` : ""}
            <p class="id">${child.id.substring(0, 12).toUpperCase()}</p>
          </div>`;
            }).join("");

            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Labels - KiddoChecker</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
          <style>
            body { font-family: 'Arial', sans-serif; background: white; margin: 0; padding: 10px; }
            .grid { display: flex; flex-wrap: wrap; gap: 16px; padding: 10px; }
            .label { border: 2px solid #1e293b; border-radius: 12px; padding: 16px; width: 200px; text-align: center; page-break-inside: avoid; }
            .org { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; }
            .name { font-size: 14px; font-weight: 900; color: #0f172a; margin: 8px 0 2px; }
            .age { font-size: 11px; color: #94a3b8; font-weight: bold; }
            .class-label { font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; }
            .allergy { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 4px 8px; font-size: 9px; font-weight: 700; color: #92400e; margin: 6px 0 2px; }
            .phone { font-size: 9px; color: #94a3b8; margin: 4px 0; }
            .id { font-size: 8px; color: #cbd5e1; font-family: monospace; margin: 4px 0 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="grid">${labelsHTML}</div>
          <script>
            window.onload = function() {
              document.querySelectorAll('.qr-placeholder').forEach(function(el) {
                new QRCode(el, { text: decodeURIComponent(el.dataset.value), width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
              });
              setTimeout(function(){ window.print(); window.close(); }, 1500);
            };
          </script>
        </body>
        </html>
      `);
            printWindow.document.close();
            setIsPrinting(false);
        }, 200);
    };

    return (
        <UnifiedDashboardLayout>
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                                <QrCode className="h-8 w-8 text-indigo-600" />
                                QR Code Management
                            </h1>
                            <p className="text-slate-500 mt-1">Generate and print QR labels for children</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                                <button className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qrSourceType === 'standard' ? 'bg-card shadow-sm text-indigo-600' : 'text-slate-500'}`} onClick={() => setQrSourceType('standard')}>JSON</button>
                                <button className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qrSourceType === 'token' ? 'bg-card shadow-sm text-indigo-600' : 'text-slate-500'}`} onClick={() => setQrSourceType('token')}>DB Match</button>
                            </div>
                            <Button onClick={handlePrint} disabled={isPrinting} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 shadow-lg shadow-indigo-200">
                                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                {selectedChildren.size > 0 ? `Print ${selectedChildren.size}` : `Print All`}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={handleSyncAll} 
                                disabled={isSyncing}
                                className="rounded-xl border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                title="Ensure all children have DB tokens"
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Sync DB Tokens
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={handleRegenerateAll} 
                                disabled={isSyncing}
                                className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                title="Reset everything from scratch"
                            >
                                <ShieldAlert className="h-4 w-4 mr-2" />
                                Reset All
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-card rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search children..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
                    </div>
                    <Select value={filterClass} onValueChange={setFilterClass}>
                        <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((cls: any) => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {childrenLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-3"}>
                        {filtered.map((child) => {
                            const isSelected = selectedChildren.has(child.id);
                            const token = getChildToken(child.id);
                            const qrData = (qrSourceType === 'token' && token) ? token : JSON.stringify({ type: "CHILD_CHECKIN", id: child.id, name: `${child.first_name} ${child.last_name}`, v: 1 });
                            return (
                                <Card key={child.id} className={`cursor-pointer transition-all ${isSelected ? "border-indigo-500 ring-1 ring-indigo-500" : ""}`} onClick={() => toggleSelect(child.id)}>
                                    <CardContent className="p-4 text-center space-y-3">
                                        <div className="flex justify-center"><QRCodeSVG value={qrData} size={100} level="H" /></div>
                                        <div>
                                            <p className="font-bold text-sm truncate">{child.first_name} {child.last_name}</p>
                                            <p className="text-[10px] text-slate-500">{token ? "DB Ready" : "JSON Only"}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); setSelectedChild(child); }}>
                                            <Eye className="h-3 w-3 mr-1" /> Preview
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <AnimatePresence>
                    {selectedChild && (
                        <Dialog open={!!selectedChild} onOpenChange={() => setSelectedChild(null)}>
                            <DialogContent className="max-w-md rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle>Label Preview: {selectedChild.first_name}</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-center py-4">
                                    <QRLabel child={selectedChild} useToken={qrSourceType === 'token'} tokenData={getChildToken(selectedChild.id)} />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button className={`flex-1 py-2 rounded-lg text-xs font-bold ${qrSourceType === 'standard' ? 'bg-card shadow' : ''}`} onClick={() => setQrSourceType('standard')}>standard json</button>
                                        <button className={`flex-1 py-2 rounded-lg text-xs font-bold ${qrSourceType === 'token' ? 'bg-card shadow' : ''}`} onClick={() => setQrSourceType('token')}>database token</button>
                                    </div>
                                    {qrSourceType === 'token' && (
                                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            {getChildToken(selectedChild.id) ? (
                                                <div className="flex items-center justify-between text-[10px] font-mono truncate">
                                                    <span>{getChildToken(selectedChild.id)}</span>
                                                    <Button variant="link" size="sm" onClick={() => setIsRegenDialogOpen(true)}>change</Button>
                                                </div>
                                            ) : (
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => generateQRCode(selectedChild.id)}>Generate Token</Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setSelectedChild(null)}>Close</Button>
                                    <Button className="flex-1 bg-indigo-600" onClick={() => { handlePrint(); setSelectedChild(null); }}>Print</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>

                <Dialog open={isRegenDialogOpen} onOpenChange={setIsRegenDialogOpen}>
                    <DialogContent className="max-w-sm rounded-3xl">
                        <DialogHeader><DialogTitle>Set Manual Code</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input placeholder="Enter code..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
                            <div className="flex flex-col gap-2">
                                <Button onClick={handleSetManualCode} disabled={!manualCode.trim() || isSavingCode}>Save Code</Button>
                                <Button variant="outline" onClick={() => { if (selectedChild) generateQRCode(selectedChild.id); setIsRegenDialogOpen(false); }}>Auto-Generate</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </UnifiedDashboardLayout>
    );
};

export default QRManagementPage;


