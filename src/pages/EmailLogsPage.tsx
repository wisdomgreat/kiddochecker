import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/apiClient';
import { 
  Mail, MailCheck, MailX, Send, RefreshCw, Search, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Filter, Sparkles, ExternalLink, ShieldCheck, ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  recipient: string;
  recipient_name: string | null;
  subject: string;
  template_type: string;
  status: 'sent' | 'delivered' | 'failed' | 'queued';
  message_id: string | null;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  sentLast24h: number;
  uniqueRecipients: number;
}

const EmailLogsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // 1. Fetch Email Statistics from Azure Container App
  const { data: stats } = useQuery<EmailStats>({
    queryKey: ['email-stats'],
    queryFn: async () => {
      return await apiFetch('/api/emails/stats');
    },
    refetchInterval: 8000,
  });

  // 2. Fetch Email Delivery Logs from Azure Container App
  const { data: logsData, isLoading, refetch, isFetching } = useQuery<{
    logs: EmailLog[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['email-logs', page, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        status: statusFilter,
        ...(searchTerm.trim() ? { search: searchTerm.trim() } : {})
      });
      return await apiFetch(`/api/emails/logs?${params.toString()}`);
    },
    refetchInterval: 8000,
  });

  // 3. Trigger Summer Camp Pass Broadcast via Azure Communication Services
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch('/api/emails/broadcast-summer-camp', {
        method: 'POST',
        body: JSON.stringify({
          churchName: 'Green Valley Alliance'
        })
      });
    },
    onSuccess: (data) => {
      toast.success('Summer Camp Fast-Pass Broadcast Initiated!', {
        description: `Sending Fast-Pass PIN emails to ${data.familiesCount} families in the background. Real-time logs are updating below.`
      });
      setIsBroadcastDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
    onError: (err: any) => {
      toast.error('Broadcast Failed', {
        description: err.message
      });
    }
  });

  const deliveryRate = stats && stats.totalSent > 0 
    ? Math.round((stats.totalDelivered / stats.totalSent) * 100) 
    : 100;

  return (
    <ModernLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-0.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Azure Communication Services
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Live Delivery Monitor
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Email Delivery Logs & Broadcasts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all transactional notifications, check-in PIN passes, and broadcast emails sent to parents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBroadcastDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
            >
              <Send className="h-4 w-4" />
              Send Parent Summer Camp Passes
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Emails Sent</p>
                <h3 className="text-2xl font-black mt-1 text-foreground">{stats?.totalSent ?? 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-primary">{stats?.sentLast24h ?? 0}</span> in last 24h
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Successfully Delivered</p>
                <h3 className="text-2xl font-black mt-1 text-emerald-600">{stats?.totalDelivered ?? 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-semibold text-emerald-600">{deliveryRate}%</span> delivery success rate
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <MailCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Failed / Bounced</p>
                <h3 className="text-2xl font-black mt-1 text-rose-600">{stats?.totalFailed ?? 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.totalFailed === 0 ? 'No delivery issues' : 'Check errors in table below'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <MailX className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unique Parents</p>
                <h3 className="text-2xl font-black mt-1 text-indigo-600">{stats?.uniqueRecipients ?? 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Verified email inboxes</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipient email, parent name, or subject..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-background"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              {(['all', 'delivered', 'sent', 'failed'] as const).map((st) => (
                <Button
                  key={st}
                  variant={statusFilter === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className="capitalize text-xs h-8"
                >
                  {st}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email Logs Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Delivery Activity</CardTitle>
                <CardDescription className="text-xs">
                  Showing {logsData?.logs.length ?? 0} of {logsData?.total ?? 0} logged emails
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading email logs...</p>
              </div>
            ) : !logsData?.logs || logsData.logs.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center p-6">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                  <Mail className="h-6 w-6" />
                </div>
                <h4 className="font-semibold text-base">No email logs found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Emails sent via parent invitations, PIN passes, or summer camp broadcasts will appear here in real time.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBroadcastDialogOpen(true)}
                  className="mt-4 gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send First Broadcast
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject & Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Sent Time</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {logsData.logs.map((log) => {
                      const isDelivered = log.status === 'delivered' || log.status === 'sent';
                      const isFailed = log.status === 'failed';
                      return (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">
                              {log.recipient_name || log.recipient}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {log.recipient}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-medium text-foreground truncate">{log.subject}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="capitalize px-1.5 py-0.2 bg-muted rounded border text-[10px]">
                                {log.template_type.replace(/_/g, ' ')}
                              </span>
                              {log.message_id && (
                                <span className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-[120px]">
                                  ID: {log.message_id.slice(-8)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isDelivered ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Delivered
                              </Badge>
                            ) : isFailed ? (
                              <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold gap-1 text-xs">
                                <XCircle className="h-3 w-3" /> Failed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-semibold gap-1 text-xs">
                                <Clock className="h-3 w-3" /> {log.status}
                              </Badge>
                            )}
                            {log.error_message && (
                              <p className="text-[11px] text-rose-500 max-w-xs truncate mt-0.5" title={log.error_message}>
                                {log.error_message}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy · h:mm a') : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 text-xs font-semibold gap-1"
                            >
                              Details
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {logsData && logsData.totalPages > 1 && (
              <div className="p-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {logsData.page} of {logsData.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= logsData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broadcast Confirmation Dialog */}
        <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
                <Send className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold">Broadcast Summer Camp Fast-Passes</DialogTitle>
              <DialogDescription className="text-sm">
                This will send personalized welcome emails with the <strong>Family Fast-Pass PIN (last 4 digits of phone)</strong> and check-in instructions to all registered Summer Camp parents from <strong>Green Valley Alliance</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-xl p-4 border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold text-foreground">Azure Communication Services</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sender:</span>
                <span className="font-mono text-foreground">DoNotReply@...azurecomm.net</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-semibold text-emerald-600">Logged in Super Admin Dashboard</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsBroadcastDialogOpen(false)}
                disabled={broadcastMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => broadcastMutation.mutate()}
                disabled={broadcastMutation.isPending}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Start Broadcast Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Log Details Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Delivery Record
              </DialogTitle>
              <DialogDescription className="text-xs">
                Unique Message ID: {selectedLog?.message_id || 'N/A'}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 rounded-xl border border-border/50">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Recipient</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedLog.recipient_name || '—'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{selectedLog.recipient}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Status</span>
                    <div className="mt-0.5">
                      {selectedLog.status === 'delivered' || selectedLog.status === 'sent' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Delivered</Badge>
                      ) : (
                        <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20">Failed</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Subject</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedLog.subject}</p>
                </div>

                {selectedLog.error_message && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <span className="text-xs text-rose-600 uppercase font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Delivery Error
                    </span>
                    <p className="text-xs text-rose-700 mt-1 font-mono">{selectedLog.error_message}</p>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold">Metadata & Campers</span>
                    <pre className="mt-1 p-3 bg-slate-950 text-slate-100 text-xs rounded-lg overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
};

export default EmailLogsPage;
