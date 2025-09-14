
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';

const ParentDashboardPage = () => {
  return (
    <RoleBasedRoute allowedRoles={['parent']}>
      <UnifiedDashboardLayout>
        <UnifiedDashboard />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default ParentDashboardPage;
