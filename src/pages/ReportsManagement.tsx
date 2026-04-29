
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  FileText,
  PieChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";

const ReportsManagement = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { data: attendanceReport, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-report', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_report', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: detailedReport, isLoading: detailedLoading } = useQuery({
    queryKey: ['detailed-report', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_detailed_attendance_report', {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: summaryStats } = useQuery({
    queryKey: ['summary-stats', dateRange],
    queryFn: async () => {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .gte('attendance_date', dateRange.startDate)
        .lte('attendance_date', dateRange.endDate);

      const { data: children } = await supabase
        .from('children')
        .select('id');

      const { data: classes } = await supabase
        .from('classes')
        .select('id');

      const totalCheckIns = attendance?.length || 0;
      const totalCheckOuts = attendance?.filter(a => a.checked_out_at).length || 0;
      const averageDuration = attendance
        ?.filter(a => a.checked_out_at && a.checked_in_at)
        .reduce((acc, a) => {
          const duration = new Date(a.checked_out_at!).getTime() - new Date(a.checked_in_at!).getTime();
          return acc + (duration / (1000 * 60 * 60)); // Convert to hours
        }, 0) / (attendance?.filter(a => a.checked_out_at).length || 1);

      return {
        totalCheckIns,
        totalCheckOuts,
        totalChildren: children?.length || 0,
        totalClasses: classes?.length || 0,
        averageDuration: Math.round(averageDuration * 100) / 100
      };
    }
  });

  const handleExportReport = async (reportType: string) => {
    try {
      let data;
      let filename;
      
      if (reportType === 'attendance') {
        data = attendanceReport;
        filename = `attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      } else {
        data = detailedReport;
        filename = `detailed-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available for the selected date range",
          variant: "destructive"
        });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]).join(',');
      const csvContent = [
        headers,
        ...data.map(row => Object.values(row).map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `${filename} has been downloaded`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  // Transform data for charts
  const chartData = attendanceReport?.map(item => ({
    date: new Date(item.attendance_date).toLocaleDateString(),
    checkIns: item.total_checked_in,
    checkOuts: item.total_checked_out,
    className: item.class_name || 'Unknown'
  })) || [];

  const dailyTotals = chartData.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date);
    if (existing) {
      existing.checkIns += item.checkIns;
      existing.checkOuts += item.checkOuts;
    } else {
      acc.push({ date: item.date, checkIns: item.checkIns, checkOuts: item.checkOuts });
    }
    return acc;
  }, [] as any[]);

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and analyze attendance reports</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleExportReport('attendance')}
                  disabled={attendanceLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Summary
                </Button>
                <Button 
                  onClick={() => handleExportReport('detailed')}
                  disabled={detailedLoading}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Detailed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalCheckIns || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Check-outs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalCheckOuts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalChildren || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.totalClasses || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration (hrs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.averageDuration || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="checkIns" fill="#3b82f6" name="Check-ins" />
                  <Bar dataKey="checkOuts" fill="#ef4444" name="Check-outs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} name="Check-ins" />
                  <Line type="monotone" dataKey="checkOuts" stroke="#ef4444" strokeWidth={2} name="Check-outs" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            {detailedLoading ? (
              <div className="text-center py-8">Loading detailed report...</div>
            ) : detailedReport && detailedReport.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-border px-4 py-2 text-left">Date</th>
                      <th className="border border-border px-4 py-2 text-left">Child</th>
                      <th className="border border-border px-4 py-2 text-left">Class</th>
                      <th className="border border-border px-4 py-2 text-left">Check-in</th>
                      <th className="border border-border px-4 py-2 text-left">Check-out</th>
                      <th className="border border-border px-4 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedReport.slice(0, 50).map((record, index) => (
                      <tr key={index}>
                        <td className="border border-border px-4 py-2">
                          {new Date(record.attendance_date).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-2">{record.child_name}</td>
                        <td className="border border-border px-4 py-2">{record.class_name || 'N/A'}</td>
                        <td className="border border-border px-4 py-2">
                          {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A'}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'Not checked out'}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {record.duration_hours ? `${record.duration_hours.toFixed(1)}h` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detailedReport.length > 50 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing first 50 records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attendance data found for the selected date range
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default ReportsManagement;

