
import DocumentVerificationSystem from "@/components/admin/DocumentVerificationSystem";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";

const AdminDocumentVerification = () => {
  return (
    <ModernLayout>
      <RoleGuard requireAdminAccess>
        <DocumentVerificationSystem />
      </RoleGuard>
    </ModernLayout>
  );
};

export default AdminDocumentVerification;
