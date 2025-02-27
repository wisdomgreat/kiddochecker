
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, QrCode, UsersRound, Clock, AlertTriangle, MoreHorizontal } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";

// Mock data
const activityData = [
  { id: "1", name: "Emma Wilson", class: "Preschool Class", status: "Checked in", time: "9:45 AM" },
  { id: "2", name: "Noah Johnson", class: "Elementary Class", status: "Checked in", time: "9:48 AM" },
  { id: "3", name: "Olivia Smith", class: "Toddler Class", status: "Checked out", time: "11:30 AM" },
  { id: "4", name: "Liam Brown", class: "Elementary Class", status: "Checked out", time: "11:32 AM" },
  { id: "5", name: "Ava Davis", class: "Preschool Class", status: "Checked in", time: "11:40 AM" },
];

const classStatusData = [
  { id: "1", name: "Preschool Class", children: 12, teachers: 2, active: true },
  { id: "2", name: "Toddler Class", children: 8, teachers: 3, active: true },
  { id: "3", name: "Elementary Class", children: 15, teachers: 2, active: true },
];

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Dashboard updated",
        description: "Latest data has been loaded",
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Column definitions for the activity table
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
          value="42"
          description="Children checked in"
          icon={<User size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="TODAY"
          value="28"
          description="Children checked out"
          icon={<QrCode size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="ACTIVE"
          value="8"
          description="Classes in session"
          icon={<UsersRound size={24} />}
          actionLabel="Manage Classes"
        />
        
        <StatCard
          title="ALERTS"
          value="2"
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
          data={activityData}
          keyExtractor={(item) => item.id}
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
            {classStatusData.map((classItem) => (
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
            ))}
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
