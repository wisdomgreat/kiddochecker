import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload, FileText, CheckCircle, Clock, XCircle,
  Download, Eye, Trash2, Shield, AlertTriangle,
  ArrowRight, Loader2, Lock, AlertCircle
} from 'lucide-react';
import { useSettings } from "@/hooks/useSettings";
import { screenFileUpload } from "@/utils/file-screening";
import { useToast } from "@/hooks/use-toast";
import { useStaffVerification } from '@/hooks/useStaffVerification';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

const DocumentUploadSystem = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  const {
    verificationStatus,
    isLoadingStatus,
    requirements,
    myDocuments,
    isLoadingDocuments,
    uploadDocument,
    isUploading,
    getDocumentUrl,
  } = useStaffVerification();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Windows-Server Style Screening (FSRM)
      const screening = screenFileUpload(file, settings);
      
      if (!screening.isValid) {
        toast({
          title: "Policy Violation",
          description: screening.error,
          variant: "destructive"
        });
        return;
      }

      if (screening.isSoftLimitTriggered) {
        toast({
          title: "Soft Quota Warning",
          description: screening.error,
        });
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
           title: "Invalid Type",
           description: "Please select a PDF, JPG, or PNG file.",
           variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentType) return;
    uploadDocument(
      { file: selectedFile, documentType, description },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setDocumentType('');
          setDescription('');
          // Reset the file input
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
      }
    );
  };

  const handleViewDocument = async (filePath: string | null) => {
    if (!filePath) return;
    const url = await getDocumentUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Calculate checklist progress
  const mandatoryRequirements = requirements.filter(r => r.is_mandatory);
  const submittedMandatory = mandatoryRequirements.filter(req =>
    myDocuments.some(doc => doc.document_type === req.document_type && (doc.status === 'approved' || doc.status === 'pending'))
  );
  const completedMandatory = mandatoryRequirements.filter(req =>
    myDocuments.some(doc => doc.document_type === req.document_type && doc.status === 'approved')
  );
  
  const progress = mandatoryRequirements.length > 0
    ? Math.round((submittedMandatory.length / mandatoryRequirements.length) * 100)
    : 0;

  const overallStatus = verificationStatus?.verification_status || 'unverified';

  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {overallStatus === 'verified' ? (
          <Alert className="bg-emerald-50 border-emerald-200">
            <Shield className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-800 font-bold">Verification Complete</AlertTitle>
            <AlertDescription className="text-emerald-700">
              Your account is fully verified. You have full access to the KiddoChecker platform.
            </AlertDescription>
          </Alert>
        ) : overallStatus === 'rejected' ? (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 font-bold">Verification Rejected</AlertTitle>
            <AlertDescription className="text-red-700">
              Your verification was rejected. Please review the feedback on your documents below, re-upload corrected versions, and resubmit for review.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-amber-50 border-amber-200">
            <Lock className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold">Account Verification Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your account is pending verification. Please upload all required documents below.
              You will have <strong>limited access</strong> until an administrator verifies your credentials.
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Progress Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">Registration Progress</h3>
              <span className="text-sm font-semibold text-indigo-600">
                {submittedMandatory.length}/{mandatoryRequirements.length} submitted
              </span>
            </div>
            <Progress value={progress} className="h-3 mb-2" />
            <p className="text-xs text-slate-500">
              {submittedMandatory.length === mandatoryRequirements.length
                ? "All mandatory documents submitted! Pending final review."
                : `${mandatoryRequirements.length - submittedMandatory.length} documents remaining. Upload your documents to get verified.`
              }
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-600" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType">Document Type <span className="text-red-500">*</span></Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {requirements.map((req) => (
                        <SelectItem key={req.document_type} value={req.document_type}>
                          <div className="flex items-center gap-2">
                            <span>{req.display_name}</span>
                            {req.is_mandatory && (
                              <Badge variant="outline" className="text-xs border-red-200 text-red-600">Required</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file-upload">Document File <span className="text-red-500">*</span></Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    PDF, JPG, PNG files only. Max 200KB.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Notes (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional notes about this document..."
                  rows={2}
                />
              </div>

              {selectedFile && (
                <Alert className="bg-indigo-50 border-indigo-200">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <AlertDescription className="text-indigo-800">
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !documentType}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isUploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Submit Document for Review</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Uploaded Documents */}
          <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                My Submitted Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : myDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">No documents uploaded yet</p>
                  <p className="text-sm">Upload your required documents above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border rounded-xl p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{doc.document_name}</h3>
                            <p className="text-xs text-slate-500">
                              {requirements.find(r => r.document_type === doc.document_type)?.display_name || doc.document_type}
                              {' • '}
                              Uploaded {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}
                              {doc.file_size && ` • ${(doc.file_size / 1024 / 1024).toFixed(1)} MB`}
                            </p>
                            {doc.status === 'rejected' && doc.rejection_reason && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
                                <strong>Feedback:</strong> {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          {doc.file_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(doc.file_path)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Requirements Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <Card className="shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Required Documents Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requirements.map((req) => {
                  const matchingDoc = myDocuments.find(d => d.document_type === req.document_type);
                  const isComplete = matchingDoc?.status === 'approved';
                  const isPending = matchingDoc?.status === 'pending';
                  const isRejected = matchingDoc?.status === 'rejected';

                  return (
                    <div key={req.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isComplete ? 'bg-emerald-50 border-emerald-200' :
                        isPending ? 'bg-amber-50 border-amber-200' :
                          isRejected ? 'bg-red-50 border-red-200' :
                            'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex items-center gap-2.5">
                        {isComplete ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        ) : isPending ? (
                          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        ) : isRejected ? (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{req.display_name}</p>
                          {req.is_mandatory && (
                            <p className="text-xs text-red-500 font-medium">Mandatory</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`text-xs ${isComplete ? 'bg-emerald-100 text-emerald-800' :
                            isPending ? 'bg-amber-100 text-amber-800' :
                              isRejected ? 'bg-red-100 text-red-800' :
                                'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {isComplete ? 'Done' : isPending ? 'Reviewing' : isRejected ? 'Rejected' : 'Missing'}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {requirements.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Loading requirements...</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentUploadSystem;
