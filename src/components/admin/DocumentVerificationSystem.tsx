
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DocumentVerificationSystem = () => {
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Sample data - would be fetched from API
  const pendingDocuments = [
    {
      id: '1',
      staffName: 'Sarah Johnson',
      staffEmail: 'sarah@example.com',
      documentName: 'CPR Training Certificate',
      documentType: 'training_cert',
      uploadedAt: '2024-01-20T10:30:00Z',
      size: '1.8 MB',
      url: '/sample-document.pdf'
    },
    {
      id: '2',
      staffName: 'Mike Davis',
      staffEmail: 'mike@example.com',
      documentName: 'Reference Letter - Pastor Smith',
      documentType: 'reference',
      uploadedAt: '2024-01-19T14:15:00Z',
      size: '956 KB',
      url: '/sample-document.pdf'
    },
    {
      id: '3',
      staffName: 'Emily Wilson',
      staffEmail: 'emily@example.com',
      documentName: 'Background Check Results',
      documentType: 'background_check',
      uploadedAt: '2024-01-18T09:45:00Z',
      size: '2.1 MB',
      url: '/sample-document.pdf'
    }
  ];

  const handleApprove = async (documentId: string) => {
    setIsProcessing(true);
    try {
      // Here you would update the document status in the database
      // const { error } = await supabase
      //   .from('staff_documents')
      //   .update({ status: 'verified', verified_at: new Date(), verified_by: user.id })
      //   .eq('id', documentId);

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Document approved",
        description: "The document has been verified and approved.",
      });

      setSelectedDocument(null);
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (documentId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this document.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Here you would update the document status in the database
      // const { error } = await supabase
      //   .from('staff_documents')
      //   .update({ 
      //     status: 'rejected', 
      //     rejected_at: new Date(), 
      //     rejected_by: user.id,
      //     rejection_reason: rejectionReason
      //   })
      //   .eq('id', documentId);

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Document rejected",
        description: "The document has been rejected with feedback.",
      });

      setSelectedDocument(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Verification</h1>
        <p className="text-muted-foreground">Review and verify staff documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Documents List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Documents ({pendingDocuments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{doc.documentName}</h3>
                          <p className="text-sm text-muted-foreground">
                            <User className="h-3 w-3 inline mr-1" />
                            {doc.staffName} ({doc.staffEmail})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {formatDate(doc.uploadedAt)} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}

                {pendingDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending documents to review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Review Panel */}
        <div>
          {selectedDocument ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedDocument.documentName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Submitted by {selectedDocument.staffName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(selectedDocument.uploadedAt)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(selectedDocument.url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Simulate download
                      const link = document.createElement('a');
                      link.href = selectedDocument.url;
                      link.download = selectedDocument.documentName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="text-left">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide detailed feedback for rejection..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(selectedDocument.id)}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(selectedDocument.id)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Staff members will be notified via email of your decision. Approved documents cannot be undone.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a document to review</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerificationSystem;
