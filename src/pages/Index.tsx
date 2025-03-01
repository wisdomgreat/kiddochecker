import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, QrCode, UsersRound, Clock, AlertTriangle, MoreHorizontal } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
}

interface Class {
  id: string;
  name: string;
  children_count: number;
  teachers_count: number;
  active: boolean;
}

interface ActivityRecord {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
  actions?: string;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
}

async function fetchRecentActivity() {
  const todayDate = new Date().toISOString().split('T')[0];
  
  const { data: checkedIn, error: checkedInError } = await supabase
    .from('attendance')
    .select(`
      id,
      child_id,
      checked_in_at,
      checked_out_at,
      children(first_name, last_name),
      classes(name)
    `)
    .eq('attendance_date', todayDate)
    .order('checked_in_at', { ascending: false })
    .limit(10);

  if (checkedInError) {
    console.error("Error fetching activity data:", checkedInError);
    return [];
  }

  return checkedIn.map((record) => {
    const childName = `${record.children?.first_name || ''} ${record.children?.last_name || ''}`;
    const className = record.classes?.name || 'Unknown Class';
    const status = record.checked_out_at ? 'Checked out' : 'Checked in';
    const time = record.checked_out_at 
      ? new Date(record.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: record.id,
      name: childName.trim(),
      class: className,
      status,
      time
    };
  });
}

async function fetchClassStatus() {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      capacity
    `);

  if (error) {
    console.error("Error fetching class status:", error);
    return [];
  }

  const today = new Date().toISOString().split('T')[0];
  const classesWithCounts = await Promise.all(data.map(async (classItem) => {
    const { count: childrenCount, error: childrenError } = await supabase
      .from('attendance')
      .select('*', { count: true })
      .eq('class_id', classItem.id)
      .eq('attendance_date', today)
      .is('checked_out_at', null);

    const { count: teacherCount, error: teacherError } = await supabase
      .from('teachers')
      .select('*', { count: true })
      .eq('class_id', classItem.id);

    if (childrenError || teacherError) {
      console.error("Error fetching counts:", childrenError || teacherError);
    }

    return {
      id: classItem.id,
      name: classItem.name,
      children: childrenCount || 0,
      teachers: teacherCount || 0,
      active: true
    };
  }));

  return classesWithCounts;
}

async function fetchDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  
  const { count: checkedInCount, error: checkedInError } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('attendance_date', today);

  const { count: checkedOutCount, error: checkedOutError } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' })
    .eq('attendance_date', today)
    .not('checked_out_at', 'is', null);

  const { count: classesCount, error: classesError } = await supabase
    .from('classes')
    .select('*', { count: 'exact' });

  const alertsCount = 2;

  if (checkedInError || checkedOutError || classesError) {
    console.error("Error fetching dashboard stats:", 
      checkedInError || checkedOutError || classesError);
  }

  return {
    checkedIn: checkedInCount || 0,
    checkedOut: checkedOutCount || 0,
    classes: classesCount || 0,
    alerts: alertsCount
  };
}

const alertsData = [
  { 
    id: "1", 
    type: "Allergy Alert", 
    message: "Noah Johnson - Peanut allergy", 
    severity: "high",
    timestamp: new Date()
  },
  { 
    id: "2", 
    type: "Teacher Request", 
    message: "Elementary Class needs assistance", 
    severity: "medium",
    timestamp: new Date()
  },
  { 
    id: "3", 
    type: "System Notice", 
    message: "Printer low on paper", 
    severity: "low",
    timestamp: new Date()
  },
];

const Dashboard = () => {
  const { toast } = useToast();
  
  const { 
    data: activityData = [], 
    isLoading: isLoadingActivity 
  } = useQuery({
    queryKey: ['activity'],
    queryFn: fetchRecentActivity
  });
  
  const { 
    data: classStatusData = [], 
    isLoading: isLoadingClasses 
  } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClassStatus
  });
  
  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  useEffect(() => {
    if (!isLoadingActivity && !isLoadingClasses && !isLoadingStats) {
      toast({
        title: "Dashboard updated",
        description: "Latest data has been loaded",
      });
    }
  }, [isLoadingActivity, isLoadingClasses, isLoadingStats, toast]);

  const activityColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2">
            <User size={16} className="text-purple-600" />
          </div>
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { 
      key: "status" as const, 
      header: "Status",
      render: (value: string) => (
        <span className={value === "Checked in" ? "text-green-600" : "text-purple-600"}>
          {value}
        </span>
      ),
    },
    { key: "time" as const, header: "Time" },
  ];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Overview" },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="TODAY"
          value={isLoadingStats ? "..." : String(dashboardStats?.checkedIn || 0)}
          description="Children checked in"
          icon={<User size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="TODAY"
          value={isLoadingStats ? "..." : String(dashboardStats?.checkedOut || 0)}
          description="Children checked out"
          icon={<QrCode size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="ACTIVE"
          value={isLoadingStats ? "..." : String(dashboardStats?.classes || 0)}
          description="Classes in session"
          icon={<UsersRound size={24} />}
          actionLabel="Manage Classes"
        />
        
        <StatCard
          title="ALERTS"
          value={isLoadingStats ? "..." : String(dashboardStats?.alerts || 0)}
          description="Requires attention"
          icon={<AlertTriangle size={24} />}
          actionLabel="Resolve Issues"
        />
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
        </div>
        
        <DataTable
          columns={activityColumns}
          data={isLoadingActivity ? [] : activityData}
          keyExtractor={(item) => item.id}
          loading={isLoadingActivity}
        />
        
        <div className="mt-4 flex justify-center">
          <button className="btn-primary">View All Activity</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Class Status</h2>
          </div>
          
          <div className="space-y-4">
            {isLoadingClasses ? (
              <div className="text-center py-8">Loading class data...</div>
            ) : (
              classStatusData.map((classItem) => (
                <div key={classItem.id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="rounded-full bg-purple-100 p-2 mr-3">
                      <UsersRound size={20} className="text-purple-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{classItem.name}</h3>
                      <p className="text-sm text-gray-500">
                        {classItem.children} children, {classItem.teachers} teachers
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button className="rounded-full p-1 hover:bg-gray-100">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </button>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          className="sr-only"
                          defaultChecked={classItem.active}
                        />
                        <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform ${classItem.active ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4">
            <button className="btn-primary">Manage All Classes</button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Alerts & Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {alertsData.map((alert) => (
              <div key={alert.id} className="glass-card p-4 rounded-lg">
                <div className="flex">
                  <div className={`rounded-full p-2 mr-3 ${
                    alert.severity === "high" 
                      ? "bg-red-100" 
                      : alert.severity === "medium"
                      ? "bg-orange-100"
                      : "bg-blue-100"
                  }`}>
                    <AlertTriangle size={20} className={`${
                      alert.severity === "high" 
                        ? "text-red-600" 
                        : alert.severity === "medium"
                        ? "text-orange-600"
                        : "text-blue-600"
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{alert.type}</h3>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  
                  <button className="rounded-full p-1 hover:bg-gray-100">
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <button className="btn-primary">View All Alerts</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
