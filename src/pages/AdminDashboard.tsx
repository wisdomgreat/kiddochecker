
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Users, 
  Settings, 
  Building, 
  User, 
  PieChart, 
  Clock, 
  AlertTriangle,
  Download,
  Filter,
  ChevronDown
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";

// Mock data for locations
const locationsData = [
  { id: "1", name: "Main Campus", activeClasses: 8, totalChildren: 120, checkedInToday: 78 },
  { id: "2", name: "North Campus", activeClasses: 5, totalChildren: 75, checkedInToday: 42 },
  { id: "3", name: "Downtown Campus", activeClasses: 3, totalChildren: 45, checkedInToday: 28 },
];

// Mock data for recent activity
const recentActivityData = [
  { 
    id: "1", 
    action: "Check-in", 
    name: "Emma Wilson", 
    class: "Preschool Class", 
    location: "Main Campus", 
    time: "9:45 AM",
    parent: "Sarah Wilson"
  },
  { 
    id: "2", 
    action: "Check-in", 
    name: "Noah Johnson", 
    class: "Elementary Class", 
    location: "Main Campus", 
    time: "9:48 AM",
    parent: "Michael Johnson"
  },
  { 
    id: "3", 
    action: "Check-out", 
    name: "Olivia Smith", 
    class: "Toddler Class", 
    location: "North Campus", 
    time: "11:30 AM",
    parent: "Jennifer Smith"
  },
  { 
    id: "4", 
    action: "Check-out", 
    name: "Liam Brown", 
    class: "Elementary Class", 
    location: "Main Campus", 
    time: "11:32 AM",
    parent: "David Brown"
  },
  { 
    id: "5", 
    action: "Check-in", 
    name: "Ava Davis", 
    class: "Preschool Class", 
    location: "Downtown Campus", 
    time: "11:40 AM",
    parent: "Jessica Davis"
  },
];

// Mock alert data
const alertsData = [
  { 
    id: "1", 
    type: "System Alert", 
    message: "Printer issue at Main Campus check-in station", 
    time: "20 minutes ago",
    priority: "medium"
  },
  { 
    id: "2", 
    type: "Security Alert", 
    message: "Invalid check-out attempt for Noah Johnson", 
    time: "35 minutes ago",
    priority: "high"
  },
  { 
    id: "3", 
    type: "Capacity Alert", 
    message: "Preschool class approaching capacity (85%)", 
    time: "1 hour ago",
    priority: "low"
  },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  
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
  
  // Filter activity data based on selected location
  const filteredActivity = selectedLocation === "all" 
    ? recentActivityData 
    : recentActivityData.filter(item => {
        const location = locationsData.find(loc => loc.id === selectedLocation);
        return location && item.location === location.name;
      });
  
  // Calculate summary data
  const totalCheckedIn = locationsData.reduce((sum, loc) => sum + loc.checkedInToday, 0);
  const totalChildren = locationsData.reduce((sum, loc) => sum + loc.totalChildren, 0);
  const totalClasses = locationsData.reduce((sum, loc) => sum + loc.activeClasses, 0);
  
  // Column definitions for the activity table
  const activityColumns = [
    {
      key: "action" as const,
      header: "Action",
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "Check-in" 
            ? "bg-green-100 text-green-800" 
            : "bg-purple-100 text-purple-800"
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: "name" as const,
      header: "Child",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <User size={18} className="text-gray-500" />
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { key: "location" as const, header: "Location" },
    { key: "parent" as const, header: "Parent/Guardian" },
    { key: "time" as const, header: "Time" },
  ];

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Admin Dashboard" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <div className="relative">
            <button className="btn-secondary flex items-center gap-2">
              <Filter size={18} />
              <span>
                {dateRange === "today" ? "Today" : 
                 dateRange === "week" ? "This Week" :
                 dateRange === "month" ? "This Month" : "All Time"}
              </span>
              <ChevronDown size={18} />
            </button>
            {/* Dropdown would go here in a real implementation */}
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="TODAY"
          value={totalCheckedIn}
          description="Children checked in"
          icon={<Users size={24} />}
          actionLabel="View Details"
        />
        
        <StatCard
          title="TOTAL"
          value={totalChildren}
          description="Registered children"
          icon={<User size={24} />}
          actionLabel="View Register"
        />
        
        <StatCard
          title="ACTIVE"
          value={totalClasses}
          description="Classes in session"
          icon={<Building size={24} />}
          actionLabel="Manage Classes"
        />
        
        <StatCard
          title="ALERTS"
          value={alertsData.length}
          description="Require attention"
          icon={<AlertTriangle size={24} />}
          actionLabel="Resolve Issues"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Activity</h2>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Location:</span>
                  <select
                    className="border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="all">All Locations</option>
                    {locationsData.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <DataTable
                columns={activityColumns}
                data={filteredActivity}
                keyExtractor={(item) => item.id}
              />
              
              <div className="mt-4 flex justify-center">
                <button className="btn-primary">View All Activity</button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {locationsData.map(location => (
              <div 
                key={location.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in"
              >
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold">{location.name}</h3>
                </div>
                
                <div className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Classes:</span>
                      <span className="font-medium">{location.activeClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Children:</span>
                      <span className="font-medium">{location.totalChildren}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Checked in Today:</span>
                      <span className="font-medium">{location.checkedInToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Check-in Rate:</span>
                      <span className="font-medium">
                        {Math.round((location.checkedInToday / location.totalChildren) * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button className="w-full btn-secondary text-sm">View Location</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fade-in">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold">Active Alerts</h2>
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {alertsData.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`border-l-4 p-3 rounded-r-lg ${
                      alert.priority === "high"
                        ? "border-red-500 bg-red-50"
                        : alert.priority === "medium"
                        ? "border-orange-500 bg-orange-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{alert.type}</h3>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm my-1">{alert.message}</p>
                    <button className="text-sm text-purple-600 font-medium hover:text-purple-800">
                      Resolve Issue
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-3 border-t border-gray-200">
              <button className="w-full btn-secondary text-sm">
                View All Alerts
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold">Quick Reports</h2>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-purple-100 p-2 mr-3">
                    <BarChart3 size={18} className="text-purple-600" />
                  </div>
                  <span className="font-medium">Attendance Summary</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <PieChart size={18} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Class Distribution</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-green-100 p-2 mr-3">
                    <Clock size={18} className="text-green-600" />
                  </div>
                  <span className="font-medium">Check-in Peak Times</span>
                </button>
                
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <div className="rounded-full bg-red-100 p-2 mr-3">
                    <Settings size={18} className="text-red-600" />
                  </div>
                  <span className="font-medium">System Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
