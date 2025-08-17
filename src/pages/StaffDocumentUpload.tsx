
import DocumentUploadSystem from "@/components/staff/DocumentUploadSystem";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";

const StaffDocumentUpload = () => {
  return (
    <ModernLayout>
      <RoleGuard requireStaffAccess>
        <DocumentUploadSystem />
      </RoleGuard>
    </ModernLayout>
  );
};

export default StaffDocumentUpload;
