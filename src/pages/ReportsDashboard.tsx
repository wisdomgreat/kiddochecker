import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/CleanAuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ReportGenerator from "@/components/reports/ReportGenerator";
import {
  Download,
  RefreshCcw,
  Calendar,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Filter,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ReportType, TimeRange, COLORS } from "@/types/reports";

const ReportsDashboard = () => {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [isReportGeneratorOpen, setIsReportGeneratorOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleReportGeneratorClose = () => {
    setIsReportGeneratorOpen(false);
  };

  const { data: attendanceData = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["attendance-reports", timeRange],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        let startDate: Date;
        const endDate = new Date();
        
        switch (timeRange) {
          case "day":
            startDate = new Date();
            break;
          case "week":
            startDate = subDays(new Date(), 7);
            break;
          case "month":
            startDate = subDays(new Date(), 30);
            break;
          case "quarter":
            startDate = subDays(new Date(), 90);
            break;
          default:
            startDate = subDays(new Date(), 7);
        }

        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const formattedDateRange = dateRange.map(date => format(date, "yyyy-MM-dd"));
        
        const { data, error } = await supabase
          .from('attendance')
          .select('attendance_date, count')
          .in('attendance_date', formattedDateRange)
          .order('attendance_date');

        if (error) throw error;

        const attendanceCounts = formattedDateRange.reduce((acc, date) => {
          acc[date] = 0;
          return acc;
        }, {} as Record<string, number>);

        data.forEach(item => {
          const dateString = item.attendance_date;
          if (attendanceCounts[dateString] !== undefined) {
            attendanceCounts[dateString] += 1;
          }
        });

        return Object.entries(attendanceCounts).map(([date, count]) => ({
          date: format(new Date(date), "MMM d"),
          count
        }));
      } catch (error: any) {
        console.error("Error fetching attendance data:", error);
        toast({
          title: "Error",
          description: `Failed to load attendance data: ${error.message}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: classData = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["class-reports"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, name');

        if (classesError) throw classesError;

        const today = new Date().toISOString().split('T')[0];
        
        const classDataWithCounts = await Promise.all(
          classes.map(async (classItem) => {
            const { count } = await supabase
              .from('attendance')
              .select('*', { count: 'exact' })
              .eq('class_id', classItem.id)
              .eq('attendance_date', today)
              .is('checked_out_at', null);
            
            return {
              name: classItem.name,
              students: count || 0
            };
          })
        );
        
        return classDataWithCounts;
      } catch (error: any) {
        console.error("Error fetching class data:", error);
        toast({
          title: "Error",
          description: `Failed to load class data: ${error.message}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const { data: demographicData = [], isLoading: isLoadingDemographics } = useQuery({
    queryKey: ["demographic-reports"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from('children')
          .select('age');

        if (error) throw error;

        const ageDistribution = data.reduce((acc, child) => {
          const age = child.age || 'Unknown';
          if (!acc[age]) {
            acc[age] = 0;
          }
          acc[age] += 1;
          return acc;
        }, {} as Record<string | number, number>);

        return Object.entries(ageDistribution).map(([age, count]) => ({
          age: age === 'null' ? 'Unknown' : age,
          count
        }));
      } catch (error: any) {
        console.error("Error fetching demographic data:", error);
        toast({
          title: "Error",
          description: `Failed to load demographic data: ${error.message}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const isLoading = 
    (reportType === "attendance" && isLoadingAttendance) ||
    (reportType === "classes" && isLoadingClasses) ||
    (reportType === "demographics" && isLoadingDemographics);

  const getCurrentData = () => {
    switch (reportType) {
      case "attendance":
        return attendanceData;
      case "classes":
        return classData;
      case "demographics":
        return demographicData;
      default:
        return [];
    }
  };

  const handleExport = () => {
    const data = getCurrentData();
    const filename = `${reportType}-report-${format(new Date(), "yyyy-MM-dd")}`;
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: `${reportType} report has been exported as CSV`,
    });
  };

  const renderChart = () => {
    const data = getCurrentData();
    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-10 min-h-[400px]">
          <RefreshCcw className="animate-spin h-8 w-8 text-purple-600 mr-2" />
          <span>Loading data...</span>
        </div>
      );
    }
    
    if (!data.length) {
      return (
        <div className="flex flex-col justify-center items-center p-10 min-h-[400px] text-gray-500">
          <BarChart2 className="h-16 w-16 mb-2" />
          <h3 className="text-lg font-medium">No data available</h3>
          <p className="text-sm">There is no data available for the selected report type.</p>
        </div>
      );
    }
    
    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={reportType === "attendance" ? "date" : reportType === "classes" ? "name" : "age"}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="count" 
              name={reportType === "demographics" ? "Number of Children" : "Count"} 
              fill="#8884d8" 
            />
            {reportType === "classes" && (
              <Bar dataKey="students" name="Students" fill="#82ca9d" />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={reportType === "attendance" ? "date" : reportType === "classes" ? "name" : "age"}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              name={reportType === "demographics" ? "Number of Children" : "Count"}
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
            {reportType === "classes" && (
              <Line type="monotone" dataKey="students" name="Students" stroke="#82ca9d" />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={150}
              fill="#8884d8"
              dataKey="count"
              nameKey={reportType === "attendance" ? "date" : reportType === "classes" ? "name" : "age"}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    return null;
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={reportType} 
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">Attendance Report</SelectItem>
                <SelectItem value="classes">Class Distribution</SelectItem>
                <SelectItem value="demographics">Demographics</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={timeRange} 
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              disabled={reportType !== "attendance"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chart Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bar">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Line
                </TabsTrigger>
                <TabsTrigger value="pie">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Pie
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming Soon", description: "Advanced filters will be available soon" })}>
              <Filter className="mr-2 h-4 w-4" />
              Configure Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "attendance" 
              ? `Attendance Report (${timeRange === "day" ? "Today" : timeRange === "week" ? "Last 7 Days" : timeRange === "month" ? "Last 30 Days" : "Last 90 Days"})` 
              : reportType === "classes" 
                ? "Class Distribution" 
                : "Demographics - Age Distribution"}
          </CardTitle>
          <CardDescription>
            {reportType === "attendance" 
              ? "Daily check-ins and check-outs" 
              : reportType === "classes" 
                ? "Students per class" 
                : "Children distribution by age"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>
              Create and download custom reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportGenerator 
              open={isReportGeneratorOpen} 
              onOpenChange={setIsReportGeneratorOpen}
              onClose={handleReportGeneratorClose}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ReportsDashboard;

