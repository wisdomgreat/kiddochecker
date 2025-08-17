
import AppLayout from "@/components/layout/AppLayout";
import AttendanceTracking from "@/components/parent/AttendanceTracking";
import { useAuth } from "@/context/CleanAuthContext";

const ParentAttendancePage = () => {
  const { isParent } = useAuth();

  if (!isParent) {
    return <div>Access denied. Parent access required.</div>;
  }

  return (
    <AppLayout>
      <AttendanceTracking />
    </AppLayout>
  );
};

export default ParentAttendancePage;
