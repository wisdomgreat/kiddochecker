
import AdminDocumentVerificationSystem from "@/components/admin/DocumentVerificationSystem";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import RoleBasedRoute from "@/components/layout/RoleBasedRoute";

const AdminDocumentVerification = () => {
  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}>
      <UnifiedDashboardLayout>
        <AdminDocumentVerificationSystem />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AdminDocumentVerification;
