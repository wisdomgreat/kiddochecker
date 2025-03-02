
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCards from "@/components/dashboard/StatCards";
import ActivityTable from "@/components/dashboard/ActivityTable";
import ClassStatus from "@/components/dashboard/ClassStatus";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import { 
  useRecentActivity, 
  useClassStatus, 
  useDashboardStats,
  useRealtimeUpdates 
} from "@/hooks/useDashboardData";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    data: activityData = [], 
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
    error: activityError
  } = useRecentActivity();
  
  const { 
    data: classStatusData = [], 
    isLoading: isLoadingClasses,
    refetch: refetchClasses,
    error: classesError
  } = useClassStatus();
  
  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats,
    refetch: refetchStats,
    error: statsError
  } = useDashboardStats();

  // Use the real-time updates hook
  const { hasNewActivity, hasClassChanges, resetFlags } = useRealtimeUpdates();

  // Effect to handle real-time updates by refetching data
  useEffect(() => {
    if (hasNewActivity) {
      refetchActivity();
      refetchStats();
      resetFlags();
    }
    
    if (hasClassChanges) {
      refetchClasses();
      resetFlags();
    }
  }, [hasNewActivity, hasClassChanges, refetchActivity, refetchStats, refetchClasses, resetFlags]);

  // Effect to show toast when data is loaded
  useEffect(() => {
    if (!isLoadingActivity && !isLoadingClasses && !isLoadingStats) {
      toast({
        title: "Dashboard updated",
        description: "Latest data has been loaded",
      });
    }
  }, [isLoadingActivity, isLoadingClasses, isLoadingStats, toast]);

  // Error handling for data fetching errors
  useEffect(() => {
    if (activityError) {
      toast({
        title: "Error loading activity data",
        description: activityError.message || "Could not load recent activity",
        variant: "destructive"
      });
    }
    
    if (classesError) {
      toast({
        title: "Error loading class data",
        description: classesError.message || "Could not load class information",
        variant: "destructive"
      });
    }
    
    if (statsError) {
      toast({
        title: "Error loading dashboard stats",
        description: statsError.message || "Could not load dashboard statistics",
        variant: "destructive"
      });
    }
  }, [activityError, classesError, statsError, toast]);

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Overview" },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <StatCards stats={dashboardStats} isLoading={isLoadingStats} />
      
      <ActivityTable activityData={activityData} isLoading={isLoadingActivity} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ClassStatus classData={classStatusData} isLoading={isLoadingClasses} />
        <AlertsPanel />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
