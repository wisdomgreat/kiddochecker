
import ModernLayout from "@/components/layout/ModernLayout";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import RoleGuard from "@/components/security/RoleGuard";

const AdminUsersPage = () => {
  return (
    <ModernLayout>
      <RoleGuard requireAdminAccess>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts and permissions</p>
            </div>
          </div>
          <AdminUserManagement />
        </div>
      </RoleGuard>
    </ModernLayout>
  );
};

export default AdminUsersPage;

