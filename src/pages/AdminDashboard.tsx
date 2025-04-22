
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { User, UserPlus, Users, School, BarChart2, Settings, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import StatCards from "@/components/dashboard/StatCards";
import ClassStatus from "@/components/dashboard/ClassStatus";
import ActivityTable from "@/components/dashboard/ActivityTable";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import UpcomingEventsList from "@/components/dashboard/UpcomingEventsList";
import { useDashboardStats, useClassStatus, useRecentActivity, useRealtimeUpdates } from "@/hooks/useDashboardData";

const AdminDashboard = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch dashboard data using the hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: classData, isLoading: classLoading } = useClassStatus();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity();
  const { hasNewActivity, hasClassChanges, resetFlags } = useRealtimeUpdates();

  // Effect to handle realtime updates
  useEffect(() => {
    if (hasNewActivity || hasClassChanges) {
      resetFlags();
    }
  }, [hasNewActivity, hasClassChanges, resetFlags]);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsSuperAdmin(data?.is_super_admin || false);
      } catch (error) {
        console.error("Error checking super admin status:", error);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  // Navigation handlers for clickable cards
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <Button 
              variant="outline"
              onClick={() => handleNavigate('/staff-management')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Manage Staff
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => handleNavigate('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <StatCards stats={stats || { checkedIn: 0, checkedOut: 0, classes: 0, alerts: 0 }} isLoading={statsLoading} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2">
          <ClassStatus classData={classData || []} isLoading={classLoading} />
        </div>
        <div>
          <UpcomingEventsList />
        </div>
      </div>
      
      <div className="mt-6">
        <ActivityTable activityData={activityData || []} isLoading={activityLoading} />
      </div>
      
      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
        <Card 
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleNavigate('/users-management')}
        >
          <CardContent className="p-4 flex items-center">
            <Users className="h-8 w-8 text-purple-500 mr-4" />
            <div>
              <h3 className="font-medium">User Management</h3>
              <p className="text-sm text-gray-500">Manage families and children</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleNavigate('/classes-management')}
        >
          <CardContent className="p-4 flex items-center">
            <School className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <h3 className="font-medium">Classes</h3>
              <p className="text-sm text-gray-500">Organize classes and teachers</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleNavigate('/events-management')}
        >
          <CardContent className="p-4 flex items-center">
            <Calendar className="h-8 w-8 text-green-500 mr-4" />
            <div>
              <h3 className="font-medium">Events</h3>
              <p className="text-sm text-gray-500">Manage upcoming events</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleNavigate('/reports-dashboard')}
        >
          <CardContent className="p-4 flex items-center">
            <BarChart2 className="h-8 w-8 text-amber-500 mr-4" />
            <div>
              <h3 className="font-medium">Reports</h3>
              <p className="text-sm text-gray-500">View attendance reports</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => handleNavigate('/check-in-kiosk')}
        >
          <CardContent className="p-4 flex items-center">
            <CheckCircle className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <h3 className="font-medium">Check-in Kiosk</h3>
              <p className="text-sm text-gray-500">Open the check-in screen</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <AlertsPanel />
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
