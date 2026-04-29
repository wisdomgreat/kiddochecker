import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  FileText, CheckCircle, XCircle, Eye, User,
  Clock, AlertTriangle, Shield, ShieldCheck, ShieldX,
  Users, Loader2, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStaffVerification, StaffDocument, PendingVerification } from '@/hooks/useStaffVerification';
import { format } from 'date-fns';

const AdminDocumentVerificationSystem = () => {
  const [selectedStaff, setSelectedStaff] = useState<PendingVerification | null>(null);
  const [staffDocuments, setStaffDocuments] = useState<StaffDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    pendingVerifications,
    isLoadingPending,
    approveDocument,
    rejectDocument,
    verifyStaff,
    isVerifying,
    getDocumentsForUser,
    getDocumentUrl,
    requirements,
  } = useStaffVerification();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);
  const [issuanceDate, setIssuanceDate] = useState('');

  useEffect(() => {
    if (selectedStaff) {
      setLoadingDocs(true);
      getDocumentsForUser(selectedStaff.user_id).then(docs => {
        setStaffDocuments(docs);
        setLoadingDocs(false);
      });
    } else {
      setStaffDocuments([]);
    }
  }, [selectedStaff]);

  const handleViewDoc = async (filePath: string | null) => {
    if (!filePath) return;
    const url = await getDocumentUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  const handleApproveClick = (docId: string, docType: string) => {
    const req = requirements.find(r => r.document_type === docType);
    if (req?.has_expiry) {
      setApprovingDocId(docId);
      setIssuanceDate(new Date().toISOString().split('T')[0]);
      setShowApproveDialog(true);
    } else {
      executeApprove(docId);
    }
  };

  const executeApprove = (docId: string, expiryDate?: string) => {
    approveDocument(
      { documentId: docId, expiresAt: expiryDate },
      {
        onSuccess: () => {
          setStaffDocuments(prev => prev.map(d =>
            d.id === docId ? { ...d, status: 'approved' as const, expires_at: expiryDate || undefined } : d
          ));
          setShowApproveDialog(false);
          setApprovingDocId(null);
          setIssuanceDate('');
        },
      }
    );
  };

  const submitExpiryApproval = () => {
    if (!approvingDocId || !issuanceDate) return;
    const doc = staffDocuments.find(d => d.id === approvingDocId);
    if (!doc) return;
    const req = requirements.find(r => r.document_type === doc.document_type);
    const months = req?.expiry_months || (doc.document_type === 'police_check' ? 36 : 12); 
    const issueDateObj = new Date(issuanceDate);
    issueDateObj.setMonth(issueDateObj.getMonth() + months);
    executeApprove(approvingDocId, issueDateObj.toISOString());
  };

  const handleRejectDoc = () => {
    if (!rejectingDocId || !rejectionReason.trim()) return;
    rejectDocument(
      { documentId: rejectingDocId, reason: rejectionReason },
      {
        onSuccess: () => {
          setStaffDocuments(prev => prev.map(d =>
            d.id === rejectingDocId ? { ...d, status: 'rejected' as const, rejection_reason: rejectionReason } : d
          ));
          setShowRejectDialog(false);
          setRejectingDocId(null);
          setRejectionReason('');
        },
      }
    );
  };

  const handleVerifyStaff = (action: 'approve' | 'reject') => {
    if (!selectedStaff) return;
    verifyStaff(
      { 
        userId: selectedStaff.user_id, 
        action, 
        notes: verificationNotes || undefined,
        email: selectedStaff.email,
        name: selectedStaff.first_name || 'Staff'
      },
      {
        onSuccess: () => {
          setSelectedStaff(null);
          setVerificationNotes('');
        },
      }
    );
  };

  const filteredPending = pendingVerifications.filter(s =>
    !searchQuery ||
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Staff Verification</h1>
          <p className="text-sm text-muted-foreground">Audit documentation and grant platform access.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
          {pendingVerifications.length} Candidates Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Candidates List */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4" />
                Review Queue
              </CardTitle>
            </CardHeader>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <CardContent className="p-0">
              {isLoadingPending ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShieldCheck className="h-10 w-10 mx-auto opacity-20 mb-4" />
                  <p className="text-xs font-bold uppercase">All Clean</p>
                </div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredPending.map((staff) => (
                    <div
                      key={staff.user_id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                        selectedStaff?.user_id === staff.user_id ? "bg-muted border-l-4 border-l-slate-900" : ""
                      )}
                      onClick={() => setSelectedStaff(staff)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs font-bold">
                          {staff.first_name?.[0]}{staff.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{staff.first_name} {staff.last_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{staff.role}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-bold">{staff.documents_submitted} Docs</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Details */}
        <div className="lg:col-span-8">
          {selectedStaff ? (
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Audit File: {selectedStaff.first_name} {selectedStaff.last_name}</CardTitle>
                        <CardDescription>{selectedStaff.email} • Applied {format(new Date(selectedStaff.created_at), 'PPP')}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(selectedStaff.verification_status)} className="font-bold uppercase text-[10px]">
                        {selectedStaff.verification_status}
                    </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingDocs ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : staffDocuments.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>No evidentiary documents have been submitted for review.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {staffDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{doc.document_name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                {requirements.find(r => r.document_type === doc.document_type)?.display_name || doc.document_type}
                              </p>
                              {doc.description && <p className="text-xs text-muted-foreground italic mt-1">"{doc.description}"</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={getStatusVariant(doc.status)} className="font-bold text-[9px] uppercase h-5">{doc.status}</Badge>
                             {doc.file_path && (
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleViewDoc(doc.file_path)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                             )}
                             {doc.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-8 font-bold text-[10px] uppercase" onClick={() => handleApproveClick(doc.id, doc.document_type)}>Approve</Button>
                                  <Button variant="outline" size="sm" className="h-8 font-bold text-[10px] uppercase text-destructive" onClick={() => { setRejectingDocId(doc.id); setShowRejectDialog(true); }}>Reject</Button>
                                </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-900 bg-slate-50 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base">Administrative Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter final review notes..."
                    rows={3}
                  />
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 font-bold uppercase h-11"
                      onClick={() => handleVerifyStaff('approve')}
                      disabled={isVerifying}
                    >
                      {isVerifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Approve Candidate
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 font-bold uppercase h-11 text-destructive"
                      onClick={() => handleVerifyStaff('reject')}
                      disabled={isVerifying}
                    >
                      Reject Candidate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-40 text-muted-foreground">
                <Shield className="h-12 w-12 opacity-10 mb-4" />
                <p className="text-sm font-bold uppercase">Selection Required</p>
                <p className="text-xs">Pick a candidate from the queue to start audit.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Documentation Rejection</DialogTitle>
            <DialogDescription>Provide specific feedback for the candidate regarding this deficit.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Feedback..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectDoc} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expiry Management</DialogTitle>
            <DialogDescription>Define the issuance date to calculate system-monitored expiration.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase">Issuance Date</Label>
              <Input
                type="date"
                value={issuanceDate}
                onChange={(e) => setIssuanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={submitExpiryApproval} disabled={!issuanceDate} className="font-bold">Set Expiry & Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDocumentVerificationSystem;

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

