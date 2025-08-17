
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DocumentUploadSystem = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Sample data - would be fetched from API
  const myDocuments = [
    {
      id: '1',
      name: 'Background Check Certificate',
      type: 'background_check',
      status: 'verified',
      uploadedAt: '2024-01-15',
      verifiedAt: '2024-01-16',
      verifiedBy: 'admin@church.org',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'CPR Training Certificate',
      type: 'training_cert',
      status: 'pending',
      uploadedAt: '2024-01-20',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Reference Letter - Pastor Johnson',
      type: 'reference',
      status: 'rejected',
      uploadedAt: '2024-01-18',
      rejectedAt: '2024-01-19',
      rejectionReason: 'Document is not legible. Please upload a clearer version.',
      size: '956 KB'
    }
  ];

  const documentTypes = [
    { value: 'background_check', label: 'Background Check' },
    { value: 'training_cert', label: 'Training Certificate' },
    { value: 'reference', label: 'Reference Letter' },
    { value: 'medical_clearance', label: 'Medical Clearance' },
    { value: 'insurance', label: 'Insurance Documentation' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, JPG, or PNG file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast({
        title: "Missing information",
        description: "Please select a file and document type.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Here you would upload to Supabase Storage
      // const { data, error } = await supabase.storage
      //   .from('staff-documents')
      //   .upload(`${user.id}/${selectedFile.name}`, selectedFile);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Document uploaded successfully!",
        description: "Your document has been submitted for verification.",
      });

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setDescription('');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground">Upload and manage your required documents</p>
      </div>

      {/* Upload New Document */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-left">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-left">
              <Label htmlFor="file">Document File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG, PNG files only. Max 10MB.
              </p>
            </div>
          </div>

          <div className="text-left">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes about this document..."
              rows={3}
            />
          </div>

          {selectedFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !selectedFile || !documentType}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* My Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myDocuments.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {doc.uploadedAt} • {doc.size}
                      </p>
                      {doc.status === 'verified' && doc.verifiedAt && (
                        <p className="text-xs text-green-600">
                          Verified on {doc.verifiedAt} by {doc.verifiedBy}
                        </p>
                      )}
                      {doc.status === 'rejected' && doc.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    {doc.status === 'rejected' && (
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Documents Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Background Check</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span>Training Certificate</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Reference Letters (2 required)</span>
              </div>
              <Badge className="bg-red-100 text-red-800">Incomplete</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUploadSystem;
