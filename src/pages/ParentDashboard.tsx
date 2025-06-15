
import DashboardLayout from '@/components/layout/DashboardLayout';
import ParentDashboardOverview from '@/components/dashboard/ParentDashboardOverview';
import AttendanceSummary from '@/components/attendance/AttendanceSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MessageSquare, FileText } from 'lucide-react';

const ParentDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your children's attendance and stay connected.
          </p>
        </div>

        {/* Attendance Summary */}
        <AttendanceSummary />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Overview - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <ParentDashboardOverview />
          </div>

          {/* Quick Links Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="/calendar" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Calendar</div>
                    <div className="text-sm text-gray-600">View upcoming events</div>
                  </div>
                </a>
                
                <a 
                  href="/family-connect" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Family Connect</div>
                    <div className="text-sm text-gray-600">Messages & updates</div>
                  </div>
                </a>
                
                <a 
                  href="/reports" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Reports</div>
                    <div className="text-sm text-gray-600">Attendance history</div>
                  </div>
                </a>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-4">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scheduled events</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
