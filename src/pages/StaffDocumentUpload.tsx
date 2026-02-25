
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";

const StaffDocumentUpload = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Verification</h1>
          <p className="text-muted-foreground">Upload and manage your required documents for platform access</p>
        </div>
        <DocumentUploadSystem />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default StaffDocumentUpload;
