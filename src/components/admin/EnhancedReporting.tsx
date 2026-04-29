
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CalendarDays, Users, UserCheck, Clock, TrendingUp, Download, FileText, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceData {
  attendance_date: string;
  total_checked_in: number;
  total_checked_out: number;
  class_name: string;
  class_id: string;
}

interface DetailedReport {
  attendance_date: string;
  child_name: string;
  class_name: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_hours: number | null;
  checked_in_by_name: string;
  checked_out_by_name: string;
  checked_in_method: string;
  checked_out_method: string;
}

const EnhancedReporting = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("summary");

  // Fetch classes for filtering
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch attendance summary
  const { data: attendanceData = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_report', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      return (data || []) as AttendanceData[];
    }
  });

  // Fetch detailed attendance report
  const { data: detailedData = [], isLoading: detailedLoading } = useQuery({
    queryKey: ['detailed-attendance-report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_liability_audit_report', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      // Map fields from liability report to detailed report interface
      return (data || []).map((r: any) => ({
        ...r,
        check_in_time: r.checked_in_at,
        check_out_time: r.checked_out_at
      })) as DetailedReport[];
    }
  });

  // Fetch children statistics
  const { data: childrenStats } = useQuery({
    queryKey: ['children-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*');
      
      if (error) throw error;
      
      const ageGroups = data.reduce((acc: any, child: any) => {
        const ageGroup = child.age <= 3 ? '0-3' : 
                       child.age <= 6 ? '4-6' : 
                       child.age <= 10 ? '7-10' : '11+';
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {});

      return {
        totalChildren: data.length,
        ageGroups: Object.entries(ageGroups).map(([age, count]) => ({ age, count }))
      };
    }
  });

  // Filter data by selected class
  const filteredAttendanceData = selectedClass === "all" 
    ? attendanceData 
    : attendanceData.filter(item => item.class_id === selectedClass);

  const filteredDetailedData = selectedClass === "all"
    ? detailedData
    : detailedData.filter(item => {
        const classMatch = classes.find(c => c.name === item.class_name);
        return classMatch?.id === selectedClass;
      });

  // Calculate summary statistics
  const totalCheckIns = filteredAttendanceData.reduce((sum, day) => sum + (day.total_checked_in || 0), 0);
  const totalCheckOuts = filteredAttendanceData.reduce((sum, day) => sum + (day.total_checked_out || 0), 0);
  const averageDaily = filteredAttendanceData.length > 0 ? Math.round(totalCheckIns / filteredAttendanceData.length) : 0;
  const averageStayTime = filteredDetailedData
    .filter(item => item.duration_hours)
    .reduce((sum, item) => sum + (item.duration_hours || 0), 0) / 
    filteredDetailedData.filter(item => item.duration_hours).length || 0;

  // Prepare chart data
  const chartData = filteredAttendanceData.map(day => ({
    date: new Date(day.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    checkIns: day.total_checked_in || 0,
    checkOuts: day.total_checked_out || 0
  }));

  // Class distribution data
  const classDistribution = classes.map(cls => {
    const classAttendance = filteredAttendanceData
      .filter(item => item.class_id === cls.id)
      .reduce((sum, item) => sum + (item.total_checked_in || 0), 0);
    
    return {
      name: cls.name,
      value: classAttendance,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
  }).filter(item => item.value > 0);

  // Peak hours analysis
  const peakHours = filteredDetailedData.reduce((acc: any, item) => {
    if (item.check_in_time) {
      const hour = new Date(item.check_in_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
    }
    return acc;
  }, {});

  const peakHoursData = Object.entries(peakHours).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count: count as number
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const handleExportData = (format: 'csv' | 'json') => {
    const dataToExport = reportType === 'summary' ? filteredAttendanceData : filteredDetailedData;
    
    if (format === 'csv') {
      const csvContent = reportType === 'summary' 
        ? "data:text/csv;charset=utf-8," + 
          "Date,Class,Check-ins,Check-outs\n" +
          dataToExport.map((item: any) => 
            `${item.attendance_date},${item.class_name || 'All'},${item.total_checked_in || 0},${item.total_checked_out || 0}`
          ).join("\n")
        : "data:text/csv;charset=utf-8," +
          "Date,Child,Class,Check-in Time,Check-in By,Check-in Method,Check-out Time,Check-out By,Check-out Method,Duration (hours)\n" +
          dataToExport.map((item: any) => 
            `${item.attendance_date},"${item.child_name}","${item.class_name || 'N/A'}","${item.check_in_time || 'N/A'}","${item.checked_in_by_name || 'N/A'}","${item.checked_in_method || 'N/A'}","${item.check_out_time || 'N/A'}","${item.checked_out_by_name || 'N/A'}","${item.checked_out_method || 'N/A'}",${item.duration_hours || 0}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance_report_${reportType}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", jsonContent);
      link.setAttribute("download", `attendance_report_${reportType}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: `Report exported as ${format.toUpperCase()}`,
    });
  };

  if (attendanceLoading || detailedLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive insights and analytics for your organization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExportData('csv')} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExportData('json')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <DatePicker date={startDate} onDateChange={setStartDate} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <DatePicker date={endDate} onDateChange={setEndDate} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Class Filter</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Report</SelectItem>
                  <SelectItem value="analytics">Advanced Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
                <p className="text-2xl font-bold">{totalCheckIns}</p>
                <p className="text-xs text-gray-500">In selected period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Check-outs</p>
                <p className="text-2xl font-bold">{totalCheckOuts}</p>
                <p className="text-xs text-gray-500">In selected period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold">{averageDaily}</p>
                <p className="text-xs text-gray-500">Check-ins per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Stay Time</p>
                <p className="text-2xl font-bold">{averageStayTime.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">Average duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="checkIns" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="checkOuts" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" />
              Class Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {classDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Analysis */}
      {peakHoursData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Check-in Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Data Table */}
      {reportType === 'detailed' && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Child</th>
                    <th className="text-left p-2">Class</th>
                    <th className="text-left p-2">Check-in</th>
                    <th className="text-left p-2">Check-out</th>
                    <th className="text-left p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetailedData.slice(0, 20).map((record, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(record.attendance_date).toLocaleDateString()}</td>
                      <td className="p-2 font-medium">{record.child_name}</td>
                      <td className="p-2">
                        <Badge variant="outline">{record.class_name || 'N/A'}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span>{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A'}</span>
                          <span className="text-[10px] text-gray-500">By: {record.checked_in_by_name} ({record.checked_in_method})</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span>{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'Still checked in'}</span>
                          {record.check_out_time && (
                            <span className="text-[10px] text-gray-500">By: {record.checked_out_by_name} ({record.checked_out_method})</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 font-bold">{record.duration_hours ? `${record.duration_hours.toFixed(1)}h` : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDetailedData.length > 20 && (
                <div className="text-center text-gray-500 mt-4">
                  Showing first 20 records. Export for complete data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Age Demographics */}
      {childrenStats && reportType === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Children Age Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {childrenStats.ageGroups.map((group: any) => (
                <div key={group.age} className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{group.count}</div>
                  <div className="text-sm text-gray-600">Ages {group.age}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedReporting;

