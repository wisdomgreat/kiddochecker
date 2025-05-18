
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import StatCards from '@/components/dashboard/StatCards';
import ActivityTable from '@/components/dashboard/ActivityTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import UpcomingEventsList from '@/components/dashboard/UpcomingEventsList';
import ClassStatus from '@/components/dashboard/ClassStatus';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';

const AdminDashboard: React.FC = () => {
  const { user, userRole } = useAuth();
  const { data, isLoading, error } = useDashboardData();
  
  useEffect(() => {
    document.title = "Admin Dashboard | ChurchCheck";
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.user_metadata?.first_name || "Administrator"}!</p>
      </div>

      <StatCards 
        checkedInCount={data?.checkedInCount || 0}
        checkedOutCount={data?.checkedOutCount || 0}
        totalTeachers={data?.teachers || 0}
        totalClasses={data?.classes || 0}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <ActivityTable activities={data?.recentActivity || []} isLoading={isLoading} />
          </Card>
        </div>
        
        <div>
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
            <AlertsPanel alerts={data?.alerts || []} isLoading={isLoading} />
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <UpcomingEventsList events={data?.upcomingEvents || []} isLoading={isLoading} />
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Class Status</h2>
            <ClassStatus classes={data?.classStatus || []} isLoading={isLoading} />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
