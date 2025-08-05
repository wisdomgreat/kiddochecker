
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, Users, UserCheck, Clock, TrendingUp, Download } from "lucide-react";

const ReportsAndAnalytics = () => {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  // Fetch attendance summary
  const { data: attendanceData = [] } = useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_report', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-statistics'],
    queryFn: async () => {
      const { data: users } = await supabase.rpc('get_users_with_roles' as any);
      
      if (!users) return { totalUsers: 0, roleBreakdown: [] };
      
      const roleBreakdown = users.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalUsers: users.length,
        roleBreakdown: Object.entries(roleBreakdown).map(([role, count]) => ({
          role,
          count,
          color: getRoleColor(role)
        }))
      };
    }
  });

  const getRoleColor = (role: string) => {
    const colors = {
      'super_admin': '#8B5CF6',
      'admin': '#EF4444',
      'teacher': '#10B981',
      'teacher_assistant': '#3B82F6',
      'staff': '#6B7280',
      'parent': '#F59E0B'
    };
    return colors[role as keyof typeof colors] || '#6B7280';
  };

  // Calculate summary statistics
  const totalCheckIns = attendanceData.reduce((sum: number, day: any) => sum + (day.total_checked_in || 0), 0);
  const totalCheckOuts = attendanceData.reduce((sum: number, day: any) => sum + (day.total_checked_out || 0), 0);
  const averageDaily = attendanceData.length > 0 ? Math.round(totalCheckIns / attendanceData.length) : 0;

  // Prepare chart data
  const chartData = attendanceData.map((day: any) => ({
    date: new Date(day.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    checkIns: day.total_checked_in || 0,
    checkOuts: day.total_checked_out || 0
  }));

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Check-ins,Check-outs\n"
      + attendanceData.map((day: any) => `${day.attendance_date},${day.total_checked_in},${day.total_checked_out}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-gray-600">Insights and analytics for your organization</p>
        </div>
        <Button onClick={handleExportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker date={startDate} onDateChange={setStartDate} />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <DatePicker date={endDate} onDateChange={setEndDate} />
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
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{userStats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="checkIns" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="checkOuts" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userStats?.roleBreakdown || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ role, count }) => `${role}: ${count}`}
                >
                  {userStats?.roleBreakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="checkIns" fill="#10B981" name="Check-ins" />
              <Bar dataKey="checkOuts" fill="#EF4444" name="Check-outs" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAndAnalytics;
