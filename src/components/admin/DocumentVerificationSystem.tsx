import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  FileText, CheckCircle, XCircle, Eye, Download, User,
  Clock, AlertTriangle, Shield, ShieldCheck, ShieldX,
  Users, Loader2, ExternalLink, Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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

  // Load documents when a staff member is selected
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

  const handleApproveDoc = (docId: string) => {
    approveDocument(docId, {
      onSuccess: () => {
        setStaffDocuments(prev => prev.map(d =>
          d.id === docId ? { ...d, status: 'approved' as const } : d
        ));
      },
    });
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
      { userId: selectedStaff.user_id, action, notes: verificationNotes || undefined },
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

  const mandatoryReqs = requirements.filter(r => r.is_mandatory);

  const getDocumentCompletionForUser = (docs: StaffDocument[]) => {
    const approved = mandatoryReqs.filter(req =>
      docs.some(d => d.document_type === req.document_type && d.status === 'approved')
    );
    return { approved: approved.length, total: mandatoryReqs.length };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
              Staff Verification
            </h1>
            <p className="text-slate-500 mt-1">Review documents and verify staff members</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {pendingVerifications.length} Pending
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Staff List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pending Verifications
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 mx-auto text-emerald-300 mb-3" />
                  <p className="font-semibold text-slate-600">All caught up!</p>
                  <p className="text-sm text-slate-500 mt-1">No pending verifications.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredPending.map((staff) => (
                    <motion.div
                      key={staff.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedStaff?.user_id === staff.user_id
                          ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      onClick={() => setSelectedStaff(staff)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-sm font-bold text-indigo-700">
                          {staff.first_name?.[0]}{staff.last_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">
                            {staff.first_name} {staff.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{staff.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              {staff.role}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {staff.documents_submitted} docs
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Review Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          {selectedStaff ? (
            <div className="space-y-4">
              {/* Staff Info */}
              <Card className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-xl font-bold text-indigo-700">
                        {selectedStaff.first_name?.[0]}{selectedStaff.last_name?.[0]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          {selectedStaff.first_name} {selectedStaff.last_name}
                        </h2>
                        <p className="text-sm text-slate-500">{selectedStaff.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{selectedStaff.role}</Badge>
                          <Badge className={
                            selectedStaff.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              selectedStaff.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-800'
                          }>
                            {selectedStaff.verification_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">Applied</p>
                      <p className="text-sm font-medium">{format(new Date(selectedStaff.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Submitted Documents ({staffDocuments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    </div>
                  ) : staffDocuments.length === 0 ? (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        This staff member has not uploaded any documents yet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {staffDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-xl p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.status === 'approved' ? 'bg-emerald-100' :
                                  doc.status === 'rejected' ? 'bg-red-100' : 'bg-indigo-100'
                                }`}>
                                <FileText className={`h-5 w-5 ${doc.status === 'approved' ? 'text-emerald-600' :
                                    doc.status === 'rejected' ? 'text-red-600' : 'text-indigo-600'
                                  }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-slate-800">{doc.document_name}</h4>
                                <p className="text-xs text-slate-500">
                                  {requirements.find(r => r.document_type === doc.document_type)?.display_name || doc.document_type}
                                  {' • '}
                                  {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                                  {doc.file_size && ` • ${(doc.file_size / 1024 / 1024).toFixed(1)} MB`}
                                </p>
                                {doc.description && (
                                  <p className="text-xs text-slate-400 mt-0.5">Note: {doc.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-13 sm:ml-0">
                              <Badge className={getStatusColor(doc.status)}>
                                {doc.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {doc.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {doc.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {doc.status}
                              </Badge>
                              {doc.file_path && (
                                <Button variant="ghost" size="sm" onClick={() => handleViewDoc(doc.file_path)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              {doc.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                    onClick={() => handleApproveDoc(doc.id)}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                    onClick={() => {
                                      setRejectingDocId(doc.id);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Final Verification Decision */}
              <Card className="shadow-sm border-indigo-200 bg-indigo-50/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    Final Verification Decision
                  </CardTitle>
                  <CardDescription>
                    Once all documents are reviewed, make the final decision to grant or deny platform access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add verification notes (optional)..."
                    rows={2}
                  />
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleVerifyStaff('approve')}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                      )}
                      Grant Full Access
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleVerifyStaff('reject')}
                      disabled={isVerifying}
                    >
                      <ShieldX className="h-4 w-4 mr-2" />
                      Deny Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-sm h-full">
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                  <h3 className="font-bold text-slate-600 text-lg">Select a Staff Member</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose a staff member from the list to review their documents.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject Document
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The staff member will see this feedback.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Document is not legible, expired, or missing required information..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason(''); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRejectDoc}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDocumentVerificationSystem;
