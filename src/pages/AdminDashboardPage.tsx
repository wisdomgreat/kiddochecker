
import AdminGuard from "@/components/security/AdminGuard";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AppLayout from "@/components/layout/AppLayout";

const AdminDashboardPage = () => {
  return (
    <AppLayout>
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    </AppLayout>
  );
};

export default AdminDashboardPage;
