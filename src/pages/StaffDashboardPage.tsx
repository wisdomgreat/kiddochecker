
import WorkingStaffDashboard from "@/components/staff/WorkingStaffDashboard";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";

const StaffDashboardPage = () => {
  return (
    <ModernLayout>
      <RoleGuard requireStaffAccess>
        <WorkingStaffDashboard />
      </RoleGuard>
    </ModernLayout>
  );
};

export default StaffDashboardPage;
