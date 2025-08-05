
import ModernLayout from "@/components/layout/ModernLayout";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import RoleGuard from "@/components/security/RoleGuard";

const AdminUsersPage = () => {
  return (
    <ModernLayout>
      <RoleGuard requireAdminAccess>
        <AdminUserManagement />
      </RoleGuard>
    </ModernLayout>
  );
};

export default AdminUsersPage;
