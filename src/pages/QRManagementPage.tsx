import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import {
    Printer, QrCode, Search, Download, Baby, Filter, Grid3X3,
    List, ChevronDown, AlertTriangle, CheckCircle2, Phone,
    RefreshCw, Settings, X, Eye, BookOpen, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { format } from "date-fns";
import DOMPurify from "dompurify";

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

const QRLabel = ({ child, orgName = "KiddoChecker" }: { child: Child; orgName?: string }) => {
    const qrData = JSON.stringify({
        type: "CHILD_CHECKIN",
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        v: 1,
    });

    return (
        <div className="qr-print-label bg-white border-2 border-slate-800 rounded-xl p-4 w-[240px] text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{orgName}</p>
            <div className="bg-white inline-block p-2 border border-slate-200 rounded-lg">
                <QRCodeSVG value={qrData} size={QR_SIZE} level="H" includeMargin={false} />
            </div>
            <p className="font-black text-slate-900 text-base mt-2 leading-tight">{child.first_name} {child.last_name}</p>
            {child.age && <p className="text-xs text-slate-500">{child.age} years old</p>}
            {child.allergies && (
                <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg px-2 py-1">
                    <p className="text-[9px] font-bold text-amber-700 uppercase">⚠ Allergy Alert</p>
                    <p className="text-[10px] text-amber-700 font-medium leading-tight">{child.allergies}</p>
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
    const [search, setSearch] = useState("");
    const [filterClass, setFilterClass] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: children = [], isLoading } = useQuery({
        queryKey: ["qr-children"],
        queryFn: async () => {
            const { data } = await supabase
                .from("children")
                .select("*")
                .order("first_name");
            return (data || []) as Child[];
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
                const qrData = JSON.stringify({ type: "CHILD_CHECKIN", id: child.id, name: `${safeFirstName} ${safeLastName}`, v: 1 });

                return `
          <div class="label">
            <p class="org">KiddoChecker</p>
            <div class="qr-placeholder" data-value="${encodeURIComponent(qrData)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160">
                <!-- QR placeholder - actual QR rendered via JS below -->
              </svg>
            </div>
            <p class="name">${safeFirstName} ${safeLastName}</p>
            <p class="age">${child.age ? child.age + " years old" : ""}</p>
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
            .age { font-size: 11px; color: #94a3b8; margin: 0 0 4px; }
            .allergy { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 4px 8px; font-size: 9px; font-weight: 700; color: #92400e; margin: 6px 0 2px; }
            .phone { font-size: 9px; color: #94a3b8; margin: 4px 0; }
            .id { font-size: 8px; color: #cbd5e1; font-family: monospace; margin: 4px 0 0; }
            .qr-img { display: block; margin: 0 auto; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="grid">${labelsHTML}</div>
          <script>
            window.onload = function() {
              document.querySelectorAll('[data-value]').forEach(function(el) {
                el.innerHTML = "";
                try {
                  new QRCode(el, { text: decodeURIComponent(el.dataset.value), width: 160, height: 160, correctLevel: QRCode.CorrectLevel.H });
                } catch(e) {}
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

    const downloadSingleQR = (child: Child) => {
        const qrData = JSON.stringify({ type: "CHILD_CHECKIN", id: child.id, name: `${child.first_name} ${child.last_name}`, v: 1 });
        const svg = document.querySelector(`[data-child-id="${child.id}"] svg`);
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-${child.first_name}-${child.last_name}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <UnifiedDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <QrCode className="h-8 w-8 text-indigo-600" />
                                QR Code Management
                            </h1>
                            <p className="text-slate-500 mt-1">Generate and print QR labels for children</p>
                        </div>
                        <div className="flex gap-3">
                            {selectedChildren.size > 0 && (
                                <Button
                                    variant="outline"
                                    className="rounded-xl gap-2 border-red-200 text-red-600"
                                    onClick={() => setSelectedChildren(new Set())}
                                >
                                    <X className="h-4 w-4" />
                                    Clear ({selectedChildren.size})
                                </Button>
                            )}
                            <Button
                                onClick={handlePrint}
                                disabled={isPrinting}
                                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2"
                            >
                                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                {selectedChildren.size > 0 ? `Print ${selectedChildren.size} Label${selectedChildren.size > 1 ? "s" : ""}` : `Print All (${filtered.length})`}
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Children", value: children.length, color: "text-indigo-600", bg: "bg-indigo-50" },
                            { label: "With Allergies", value: children.filter((c) => c.allergies).length, color: "text-amber-600", bg: "bg-amber-50" },
                            { label: "Currently Shown", value: filtered.length, color: "text-slate-600", bg: "bg-slate-50" },
                            { label: "Selected", value: selectedChildren.size, color: "text-purple-600", bg: "bg-purple-50" },
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Controls */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search children..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-xl border-slate-200"
                            />
                        </div>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-40 rounded-xl border-slate-200">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls: any) => (
                                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={selectAll} className="rounded-xl">
                            {selectedChildren.size === filtered.length ? "Deselect All" : "Select All"}
                        </Button>
                        <div className="flex bg-slate-100 rounded-xl p-0.5">
                            <button className={`rounded-lg p-1.5 transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("grid")}>
                                <Grid3X3 className="h-4 w-4 text-slate-600" />
                            </button>
                            <button className={`rounded-lg p-1.5 transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : ""}`} onClick={() => setViewMode("list")}>
                                <List className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* QR Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={viewMode === "grid"
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            : "space-y-3"}
                    >
                        {filtered.map((child, i) => {
                            const isSelected = selectedChildren.has(child.id);
                            const qrData = JSON.stringify({ type: "CHILD_CHECKIN", id: child.id, name: `${child.first_name} ${child.last_name}`, v: 1 });

                            return (
                                <motion.div
                                    key={child.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`bg-white rounded-2xl border-2 shadow-sm cursor-pointer transition-all ${isSelected ? "border-indigo-500 shadow-indigo-100 shadow-lg" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                                        } ${viewMode === "list" ? "flex items-center gap-4 p-4" : "p-4 text-center"}`}
                                    onClick={() => toggleSelect(child.id)}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        </div>
                                    )}

                                    <div className={`relative ${viewMode === "list" ? "" : ""}`}>
                                        {viewMode === "grid" && (
                                            <div className="flex justify-center mb-2" data-child-id={child.id}>
                                                <div className="bg-white border border-slate-100 rounded-lg p-1.5">
                                                    <QRCodeSVG value={qrData} size={100} level="H" />
                                                </div>
                                            </div>
                                        )}

                                        <div className={viewMode === "list" ? "flex items-center gap-3" : ""}>
                                            {viewMode === "list" && (
                                                <div className="bg-slate-50 rounded-lg p-1.5" data-child-id={child.id}>
                                                    <QRCodeSVG value={qrData} size={48} level="H" />
                                                </div>
                                            )}
                                            <div>
                                                <p className={`font-bold text-slate-800 ${viewMode === "grid" ? "text-sm leading-tight" : "text-base"}`}>
                                                    {child.first_name} {child.last_name}
                                                </p>
                                                {child.age && <p className="text-xs text-slate-500">{child.age} yrs</p>}
                                            </div>
                                        </div>

                                        <div className={`mt-2 flex flex-wrap gap-1 ${viewMode === "grid" ? "justify-center" : ""}`}>
                                            {child.allergies && (
                                                <Badge className="badge-warning text-xs px-1.5 py-0">
                                                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Allergy
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {viewMode === "list" && (
                                        <div className="ml-auto flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl text-xs h-8"
                                                onClick={(e) => { e.stopPropagation(); setSelectedChild(child); }}
                                            >
                                                <Eye className="h-3 w-3 mr-1" />Preview
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl text-xs h-8"
                                                onClick={(e) => { e.stopPropagation(); handlePrint(); }}
                                            >
                                                <Printer className="h-3 w-3 mr-1" />Print
                                            </Button>
                                        </div>
                                    )}

                                    {viewMode === "grid" && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full mt-2 text-xs h-7 text-slate-500 hover:text-indigo-600"
                                            onClick={(e) => { e.stopPropagation(); setSelectedChild(child); }}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />Preview
                                        </Button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Print Preview Dialog */}
                <AnimatePresence>
                    {selectedChild && (
                        <Dialog open={!!selectedChild} onOpenChange={() => setSelectedChild(null)}>
                            <DialogContent className="max-w-sm rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle>QR Label Preview</DialogTitle>
                                    <DialogDescription>This is how the printed label will look</DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center py-4">
                                    <QRLabel child={selectedChild} />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl gap-2"
                                        onClick={() => { setSelectedChild(null); }}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2"
                                        onClick={() => {
                                            setSelectedChildren(new Set([selectedChild.id]));
                                            setSelectedChild(null);
                                            setTimeout(handlePrint, 100);
                                        }}
                                    >
                                        <Printer className="h-4 w-4" />Print This
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </AnimatePresence>
            </div>
        </UnifiedDashboardLayout>
    );
};

export default QRManagementPage;
