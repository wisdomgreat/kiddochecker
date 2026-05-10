import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Search, Activity, User, Shield, FileText, Clock,
    ChevronLeft, ChevronRight, Loader2, Filter, RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportSealingService } from '@/services/reportSealingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Fingerprint, Eye, Lock } from 'lucide-react';

interface AuditLogEntry {
    id: string;
    user_id: string;
    action: string;
    resource: string;
    resource_id: string | null;
    details: any;
    created_at: string;
    user_email?: string;
    user_name?: string;
}

const AuditLogPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const { data: logs = [], isLoading, refetch } = useQuery({
        queryKey: ["audit-logs", page, filterAction],
        queryFn: async () => {
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filterAction !== 'all') {
                query = query.eq('action', filterAction);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching audit logs:", error);
                return [];
            }

            // Enrich with user info
            if (data && data.length > 0) {
                const userIds = [...new Set(data.map(l => l.user_id).filter(Boolean))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', userIds);

                return data.map(log => ({
                    ...log,
                    user_name: profiles?.find(p => p.id === log.user_id)
                        ? `${profiles.find(p => p.id === log.user_id)?.first_name} ${profiles.find(p => p.id === log.user_id)?.last_name}`
                        : 'System',
                })) as unknown as AuditLogEntry[];
            }
            return (data || []) as unknown as AuditLogEntry[];
        },
    });

    const filteredLogs = logs.filter(log =>
        !searchQuery ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getActionIcon = (action: string) => {
        if (action.includes('verify') || action.includes('approve')) return <Shield className="h-4 w-4 text-emerald-600" />;
        if (action.includes('reject') || action.includes('delete')) return <Shield className="h-4 w-4 text-red-600" />;
        if (action.includes('create') || action.includes('add')) return <FileText className="h-4 w-4 text-blue-600" />;
        if (action.includes('update') || action.includes('edit')) return <FileText className="h-4 w-4 text-amber-600" />;
        return <Activity className="h-4 w-4 text-slate-500" />;
    };

    const getActionBadge = (action: string) => {
        if (action.includes('verify') || action.includes('approve')) return 'bg-emerald-100 text-emerald-800';
        if (action.includes('reject') || action.includes('delete') || action.includes('suspend')) return 'bg-red-100 text-red-800';
        if (action.includes('create') || action.includes('add')) return 'bg-blue-100 text-blue-800';
        if (action.includes('update') || action.includes('edit')) return 'bg-amber-100 text-amber-800';
        if (action.includes('login') || action.includes('auth')) return 'bg-purple-100 text-purple-800';
        return 'bg-slate-100 text-foreground';
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const { data: accessLogs = [], isLoading: isLoadingAccess } = useQuery({
        queryKey: ["data-access-logs"],
        queryFn: () => ReportSealingService.getDataAccessLogs()
    });

    const { data: reportSeals = [], isLoading: isLoadingSeals } = useQuery({
        queryKey: ["report-seals"],
        queryFn: () => ReportSealingService.getReportSeals()
    });

    const content = (
            <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                                <Shield className="h-8 w-8 text-indigo-600" />
                                Forensic & Audit Log
                            </h1>
                            <p className="text-slate-500 mt-1">Institutional-grade accountability and cryptographic verification</p>
                        </div>
                        <Button variant="outline" onClick={() => refetch()} className="rounded-xl gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </motion.div>

                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="bg-muted p-1 rounded-xl mb-6">
                        <TabsTrigger value="activity" className="rounded-lg gap-2">
                            <Activity className="h-4 w-4" /> Activity Logs
                        </TabsTrigger>
                        <TabsTrigger value="access" className="rounded-lg gap-2">
                            <Eye className="h-4 w-4" /> Access Logs
                        </TabsTrigger>
                        <TabsTrigger value="seals" className="rounded-lg gap-2">
                            <Lock className="h-4 w-4" /> Report Seals
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="activity" className="space-y-6">
                        {/* Filters */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative flex-1 w-full">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search actions, resources, users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select value={filterAction} onValueChange={setFilterAction}>
                                            <SelectTrigger className="w-48">
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue placeholder="Filter by action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Actions</SelectItem>
                                                <SelectItem value="verify_staff">Staff Verification</SelectItem>
                                                <SelectItem value="reject_staff">Staff Rejection</SelectItem>
                                                <SelectItem value="create_user">User Created</SelectItem>
                                                <SelectItem value="update_user">User Updated</SelectItem>
                                                <SelectItem value="delete_user">User Deleted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <Card className="shadow-sm">
                            <CardContent className="pt-0">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    </div>
                                ) : filteredLogs.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Activity className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                                        <h3 className="font-bold text-slate-600">No audit entries found</h3>
                                        <p className="text-sm text-slate-500 mt-1">System activity will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {filteredLogs.map((log, i) => (
                                            <div key={log.id} className="py-3.5 px-1 hover:bg-slate-50 transition-colors rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge className={`text-xs ${getActionBadge(log.action)}`}>
                                                                {formatAction(log.action)}
                                                            </Badge>
                                                            <span className="text-xs text-slate-400">on</span>
                                                            <Badge variant="outline" className="text-xs">{log.resource}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                            <span className="text-xs text-slate-600 font-medium">{log.user_name || 'Unknown'}</span>
                                                            <span className="text-xs text-slate-300">•</span>
                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                            <span className="text-xs text-slate-500">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-4 border-t mt-4">
                                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                    </Button>
                                    <span className="text-sm text-slate-500">Page {page + 1}</span>
                                    <Button variant="outline" size="sm" disabled={logs.length < pageSize} onClick={() => setPage(p => p + 1)}>
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="access" className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-indigo-600" /> Sensitive Data Access
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAccess ? (
                                    <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                                ) : accessLogs.length === 0 ? (
                                    <div className="text-center py-16 text-muted-foreground">No sensitive data access logged yet.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Resource Type</TableHead>
                                                <TableHead>Resource ID</TableHead>
                                                <TableHead>Timestamp</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {accessLogs.map((log: any) => (
                                                <TableRow key={log.id}>
                                                    <TableCell className="font-bold">
                                                        {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown'}
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline">{log.resource_type}</Badge></TableCell>
                                                    <TableCell className="font-mono text-[10px]">{log.resource_id}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">{format(new Date(log.accessed_at), 'MMM dd, yyyy HH:mm:ss')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="seals" className="space-y-6">
                        <Card className="shadow-sm border-emerald-100 bg-emerald-50/10">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Fingerprint className="h-5 w-5 text-emerald-600" /> Cryptographic Report Seals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSeals ? (
                                    <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
                                ) : reportSeals.length === 0 ? (
                                    <div className="text-center py-16 text-muted-foreground">No report seals generated yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {reportSeals.map((seal: any) => (
                                            <div key={seal.id} className="bg-card border-2 border-emerald-100/50 rounded-2xl p-6 shadow-sm">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-foreground">{seal.report_name}</h4>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Seal ID: {seal.id.substring(0, 8)}</p>
                                                    </div>
                                                    <Lock className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div className="bg-muted/50 p-3 rounded-xl mb-4">
                                                    <p className="text-[10px] font-mono break-all text-emerald-700 font-bold">{seal.report_hash}</p>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-3 w-3" />
                                                        <span>{seal.generated_by_profile ? `${seal.generated_by_profile.first_name} ${seal.generated_by_profile.last_name}` : 'System'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{format(new Date(seal.generated_at), 'MMM dd, HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
    );

    return isEmbedded ? content : <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default AuditLogPage;

