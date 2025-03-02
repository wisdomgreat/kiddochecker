
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCards from "@/components/dashboard/StatCards";
import ActivityTable from "@/components/dashboard/ActivityTable";
import ClassStatus from "@/components/dashboard/ClassStatus";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import { useRecentActivity, useClassStatus, useDashboardStats } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { toast } = useToast();
  
  const { 
    data: activityData = [], 
    isLoading: isLoadingActivity 
  } = useRecentActivity();
  
  const { 
    data: classStatusData = [], 
    isLoading: isLoadingClasses 
  } = useClassStatus();
  
  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats 
  } = useDashboardStats();

  useEffect(() => {
    if (!isLoadingActivity && !isLoadingClasses && !isLoadingStats) {
      toast({
        title: "Dashboard updated",
        description: "Latest data has been loaded",
      });
    }
  }, [isLoadingActivity, isLoadingClasses, isLoadingStats, toast]);

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
