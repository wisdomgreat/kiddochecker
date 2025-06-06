
import DashboardLayout from '@/components/layout/DashboardLayout';
import CheckInManagement from '@/components/check-in/CheckInManagement';

const CheckInOutPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Check-In/Out Management</h1>
            <p className="text-muted-foreground">
              Manage child attendance and check-in/out processes.
            </p>
          </div>
        </div>
        <CheckInManagement />
      </div>
    </DashboardLayout>
  );
};

export default CheckInOutPage;
