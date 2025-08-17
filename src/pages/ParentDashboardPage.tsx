
import WorkingParentDashboard from "@/components/parent/WorkingParentDashboard";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";

const ParentDashboardPage = () => {
  return (
    <ModernLayout>
      <RoleGuard requireParentAccess>
        <WorkingParentDashboard />
      </RoleGuard>
    </ModernLayout>
  );
};

export default ParentDashboardPage;
