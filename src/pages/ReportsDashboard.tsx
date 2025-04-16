
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bar, 
  BarChart as RechartsBarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  Line,
  LineChart as RechartsLineChart
} from 'recharts';
import { CircularProgress } from "@/components/ui/circular-progress";
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

// Mock data for charts
const getAttendanceByDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  
  return days.map((day, index) => ({
    name: day,
    checkins: Math.floor(Math.random() * 50) + 10,
    checkouts: Math.floor(Math.random() * 50) + 5,
    isToday: index === today
  }));
};

const getAttendanceByClass = () => {
  const classes = ['Toddler', 'Preschool', 'Elementary', 'Middle School', 'High School'];
  
  return classes.map((className) => ({
    name: className,
    value: Math.floor(Math.random() * 100) + 20
  }));
};

const getAttendanceTrend = () => {
  const data = [];
  for (let i = 14; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, 'MMM dd'),
      attendance: Math.floor(Math.random() * 30) + 40 + (i < 7 ? 20 : 0), // Simulate increasing trend in recent days
    });
  }
  return data;
};

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState("attendance");
  const { toast } = useToast();
  
  // Mock data for demonstration
  const attendanceByDay = getAttendanceByDay();
  const attendanceByClass = getAttendanceByClass();
  const attendanceTrend = getAttendanceTrend();
  
  // Fetch attendance stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      try {
        // In a real implementation, this would fetch actual data from Supabase
        // For now, returning mock data
        return {
          totalCheckins: 1245,
          totalCheckouts: 1187,
          uniqueChildren: 487,
          averageAttendance: 78.3,
        };
      } catch (error: any) {
        console.error("Error fetching attendance stats:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance statistics",
          variant: "destructive",
        });
        return {
          totalCheckins: 0,
          totalCheckouts: 0,
          uniqueChildren: 0,
          averageAttendance: 0,
        };
      }
    },
  });
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Export Reports
          </Button>
          <Button variant="outline" size="sm">
            Print
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="attendance" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="attendance" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="demographics" className="flex items-center">
            <PieChart className="mr-2 h-4 w-4" />
            Demographics
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center">
            <LineChart className="mr-2 h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Total Check-ins" 
              value={isLoadingStats ? null : stats?.totalCheckins} 
              trend="+12% from last month"
              trendPositive={true}
            />
            <StatsCard 
              title="Total Check-outs" 
              value={isLoadingStats ? null : stats?.totalCheckouts} 
              trend="+9% from last month"
              trendPositive={true}
            />
            <StatsCard 
              title="Unique Children" 
              value={isLoadingStats ? null : stats?.uniqueChildren} 
              trend="+5% from last month"
              trendPositive={true}
            />
            <StatsCard 
              title="Avg. Attendance" 
              value={isLoadingStats ? null : `${stats?.averageAttendance}%`} 
              trend="-2.1% from last month"
              trendPositive={false}
            />
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={attendanceByDay}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Check-ins" dataKey="checkins" fill="#8884d8" />
                    <Bar name="Check-outs" dataKey="checkouts" fill="#82ca9d" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance by Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={attendanceByClass}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceByClass.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Check-in Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {/* Placeholder for check-in times distribution chart */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Coming soon: Check-in time distribution chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {/* Placeholder for age distribution chart */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Coming soon: Age distribution chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {/* Placeholder for gender distribution chart */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Coming soon: Gender distribution chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New vs. Returning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {/* Placeholder for new vs. returning chart */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Coming soon: New vs. returning children chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Attendance Trend (Last 2 Weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={attendanceTrend}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {/* Placeholder for growth rate chart */}
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Coming soon: Attendance growth rate chart</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seasonal Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {/* Placeholder for seasonal patterns chart */}
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">Coming soon: Seasonal attendance patterns chart</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </MainLayout>
    );
  };
  
  // Stats card component
  interface StatsCardProps {
    title: string;
    value: string | number | null;
    trend: string;
    trendPositive: boolean;
  }
  
  const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendPositive }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">{title}</span>
          {value === null ? (
            <div className="py-2">
              <CircularProgress size="small" />
            </div>
          ) : (
            <span className="text-2xl font-bold">{value}</span>
          )}
          <span className={`text-xs ${trendPositive ? 'text-green-500' : 'text-red-500'} mt-1`}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
  
  export default ReportsDashboard;
