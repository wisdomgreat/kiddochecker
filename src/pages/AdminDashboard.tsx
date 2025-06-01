
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import StatCards from '@/components/dashboard/StatCards';
import ActivityTable from '@/components/dashboard/ActivityTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import UpcomingEventsList from '@/components/dashboard/UpcomingEventsList';
import ClassStatus from '@/components/dashboard/ClassStatus';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const AdminDashboard: React.FC = () => {
  const { user, userRole } = useAuth();
  const { data, isLoading, error } = useDashboardStats();
  
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
        stats={data?.stats || { checkedIn: 0, checkedOut: 0, classes: 0, alerts: 0 }}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <ActivityTable activityData={data?.recentActivity || []} isLoading={isLoading} />
          </Card>
        </div>
        
        <div>
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
            <AlertsPanel />
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <UpcomingEventsList />
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Class Status</h2>
            <ClassStatus />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
