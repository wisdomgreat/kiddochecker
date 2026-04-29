
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';

const StaffDashboardPage = () => {
  return (
    <RoleBasedRoute allowedRoles={['staff', 'teacher', 'teacher_assistant']}>
      <UnifiedDashboardLayout>
        <UnifiedDashboard />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default StaffDashboardPage;

