
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';

const AdminDashboardPage = () => {
  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}>
      <UnifiedDashboardLayout>
        <UnifiedDashboard />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default AdminDashboardPage;

