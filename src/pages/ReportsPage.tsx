
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('attendance');
  const [timeRange, setTimeRange] = useState('week');

  // Mock data
  const attendanceData = [
    { name: 'Mon', checkIns: 45, checkOuts: 43 },
    { name: 'Tue', checkIns: 52, checkOuts: 50 },
    { name: 'Wed', checkIns: 49, checkOuts: 47 },
    { name: 'Thu', checkIns: 48, checkOuts: 46 },
    { name: 'Fri', checkIns: 51, checkOuts: 49 },
  ];

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting report...');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
            <p className="text-muted-foreground">
              Generate and view detailed reports for your organization.
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Report Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="classes">Classes</SelectItem>
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
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">Total Check-ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">49</div>
              <p className="text-xs text-muted-foreground">Children per day</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="checkIns" fill="#8884d8" name="Check-ins" />
                <Bar dataKey="checkOuts" fill="#82ca9d" name="Check-outs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle>Attendance Reports</CardTitle>
                  <p className="text-sm text-muted-foreground">Daily attendance tracking</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <PieChart className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle>Class Distribution</CardTitle>
                  <p className="text-sm text-muted-foreground">Students per class</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle>Demographics</CardTitle>
                  <p className="text-sm text-muted-foreground">Age and enrollment data</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
