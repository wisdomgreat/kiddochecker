import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Search, RefreshCw, Filter, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SecurityIssue {
  id: string;
  vuln_code: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: string;
  owasp_category: string;
  nist_control: string;
  iso_control: string;
  cvss_score: number;
  status: "open" | "in_progress" | "resolved" | "verified";
  affected_component: string;
  remediation_details: string;
  verification_test: string;
  resolved_at: string | null;
  updated_at: string;
}

export const SecurityTrackerPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["security-issues", statusFilter, severityFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (severityFilter !== "all") params.append("severity", severityFilter);
      if (search.trim()) params.append("search", search.trim());
      
      const res = await apiFetch(`/api/admin/security/issues?${params.toString()}`);
      return res || { data: [], summary: {} };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, remediation_details }: { id: string; status: string; remediation_details?: string }) => {
      return await apiFetch(`/api/admin/security/issues/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, remediation_details }),
      });
    },
    onSuccess: () => {
      toast.success("Security issue updated successfully");
      queryClient.invalidateQueries({ queryKey: ["security-issues"] });
    },
    onError: (err: any) => {
      toast.error("Failed to update issue: " + err.message);
    },
  });

  const issues: SecurityIssue[] = data?.data || [];
  const summary = data?.summary || {};

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-bold uppercase text-[10px]">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold uppercase text-[10px]">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold uppercase text-[10px]">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold uppercase text-[10px]">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Info</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      case "verified":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> In Progress</Badge>;
      default:
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 gap-1"><AlertTriangle className="w-3 h-3" /> Open</Badge>;
    }
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-primary" />
              Security & Compliance Issues Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active tracking and remediation monitoring across NIST SP 800-53, ISO/IEC 27001, and OWASP Top 10.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Findings</p>
              <p className="text-2xl font-black text-foreground mt-1">{summary.total || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Resolved / Verified</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{summary.resolved || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Critical Issues</p>
              <p className="text-2xl font-black text-red-500 mt-1">{summary.critical || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wider">High Severity</p>
              <p className="text-2xl font-black text-orange-500 mt-1">{summary.high || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{summary.in_progress || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Avg CVSS</p>
              <p className="text-2xl font-black text-primary mt-1">{summary.avg_cvss || "0.0"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vulnerability code, title, NIST control, or OWASP category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card/50">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card/50">
              <SelectValue placeholder="Severity Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading security findings...</Card>
          ) : issues.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No matching security issues found.</Card>
          ) : (
            issues.map((issue) => (
              <Card 
                key={issue.id} 
                className={`border-border transition-all hover:border-primary/40 cursor-pointer ${
                  selectedIssue?.id === issue.id ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {issue.vuln_code}
                        </span>
                        {getSeverityBadge(issue.severity)}
                        {getStatusBadge(issue.status)}
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          CVSS: <strong className="text-foreground">{issue.cvss_score}</strong>
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground">
                        {issue.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>OWASP: <strong className="text-foreground">{issue.owasp_category}</strong></span>
                        <span>NIST: <strong className="text-foreground">{issue.nist_control}</strong></span>
                        <span>ISO 27001: <strong className="text-foreground">{issue.iso_control}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 lg:pt-0">
                      <Select
                        value={issue.status}
                        onValueChange={(val) => updateMutation.mutate({ id: issue.id, status: val })}
                      >
                        <SelectTrigger className="h-8 text-xs w-[130px]" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Expanded Details View */}
                  {selectedIssue?.id === issue.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-muted-foreground uppercase text-[10px]">Affected Component</p>
                        <p className="font-mono text-foreground mt-0.5">{issue.affected_component}</p>
                      </div>
                      <div>
                        <p className="font-bold text-muted-foreground uppercase text-[10px]">Remediation Details</p>
                        <p className="text-foreground mt-0.5 leading-relaxed">{issue.remediation_details}</p>
                      </div>
                      <div>
                        <p className="font-bold text-muted-foreground uppercase text-[10px]">Verification Proof / Test</p>
                        <p className="text-foreground mt-0.5 leading-relaxed font-mono bg-muted/50 p-2 rounded">
                          {issue.verification_test}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default SecurityTrackerPage;
