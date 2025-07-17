
import { useState } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  Calendar,
  Activity,
  BarChart3,
  QrCode,
  Monitor
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch today's attendance stats
  const { data: todayStats } = useQuery({
    queryKey: ["today-stats", selectedDate],
    queryFn: async () => {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('id, checked_in_at, checked_out_at, class_id')
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;

      const totalCheckedIn = attendance?.length || 0;
      const stillPresent = attendance?.filter(a => a.checked_in_at && !a.checked_out_at).length || 0;
      const checkedOut = attendance?.filter(a => a.checked_out_at).length || 0;

      return {
        totalCheckedIn,
        stillPresent,
        checkedOut
      };
    },
  });

  // Fetch children with allergies who are present
  const { data: allergiesAlert } = useQuery({
    queryKey: ["allergies-alert", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          child_id,
          children!inner (
            first_name,
            last_name,
            allergies
          )
        `)
        .eq('attendance_date', selectedDate)
        .is('checked_out_at', null)
        .neq('children.allergies', '')
        .not('children.allergies', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent check-ins
  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["recent-checkins", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          checked_in_at,
          checked_out_at,
          children (first_name, last_name),
          classes (name)
        `)
        .eq('attendance_date', selectedDate)
        .order('checked_in_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch class occupancy
  const { data: classOccupancy = [] } = useQuery({
    queryKey: ["class-occupancy", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          class_id,
          classes (name, capacity)
        `)
        .eq('attendance_date', selectedDate)
        .is('checked_out_at', null);
      
      if (error) throw error;

      // Group by class and count attendance
      const classGroups = data?.reduce((acc: any, record) => {
        const classId = record.class_id;
        if (classId && record.classes) {
          if (!acc[classId]) {
            acc[classId] = {
              name: record.classes.name,
              capacity: record.classes.capacity,
              current: 0
            };
          }
          acc[classId].current += 1;
        }
        return acc;
      }, {});

      return Object.values(classGroups || {});
    },
  });

  // Fetch weekly attendance chart data
  const { data: weeklyData } = useQuery({
    queryKey: ["weekly-attendance"],
    queryFn: async () => {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const promises = dates.map(async (date) => {
        const { data, error } = await supabase
          .from('attendance')
          .select('id')
          .eq('attendance_date', date);
        
        if (error) throw error;
        return { date, count: data?.length || 0 };
      });

      const results = await Promise.all(promises);
      return results;
    },
  });

  const chartData = {
    labels: weeklyData?.map(d => format(new Date(d.date), 'MMM dd')) || [],
    datasets: [
      {
        label: 'Daily Check-ins',
        data: weeklyData?.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Weekly Attendance Trend',
      },
    },
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-muted-foreground">Monitor daily operations and manage check-ins/check-outs.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/check-in-kiosk')}>
              <QrCode className="mr-2 h-4 w-4" />
              Check-in Kiosk
            </Button>
            <Button onClick={() => navigate('/check-out-station')}>
              <Monitor className="mr-2 h-4 w-4" />
              Check-out Station
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                  <p className="text-2xl font-bold">{todayStats?.totalCheckedIn || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Currently Present</p>
                  <p className="text-2xl font-bold">{todayStats?.stillPresent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">{todayStats?.checkedOut || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Allergy Alerts</p>
                  <p className="text-2xl font-bold">{allergiesAlert?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Check-ins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No check-ins yet today</h3>
                  <p className="text-muted-foreground">
                    Recent check-ins will appear here as they happen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.slice(0, 8).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.children?.first_name} {record.children?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.classes?.name || 'No class assigned'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {record.checked_in_at ? format(new Date(record.checked_in_at), 'HH:mm') : '-'}
                        </p>
                        {record.checked_out_at ? (
                          <Badge variant="secondary">Checked Out</Badge>
                        ) : (
                          <Badge variant="default">Present</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Class Occupancy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Class Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classOccupancy.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No classes active</h3>
                  <p className="text-muted-foreground">
                    Class occupancy will be shown here when children are checked in.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classOccupancy.map((classInfo: any, index) => {
                    const occupancyRate = classInfo.capacity ? (classInfo.current / classInfo.capacity) * 100 : 0;
                    const isNearFull = occupancyRate > 85;
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{classInfo.name}</h4>
                          <Badge variant={isNearFull ? "destructive" : "secondary"}>
                            {classInfo.current}/{classInfo.capacity || '∞'}
                          </Badge>
                        </div>
                        {classInfo.capacity && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isNearFull ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Allergy Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Allergy Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allergiesAlert?.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No allergy alerts</h3>
                  <p className="text-muted-foreground">
                    Children with allergies who are currently present will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allergiesAlert?.map((alert: any) => (
                    <div key={alert.child_id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-900">
                            {alert.children.first_name} {alert.children.last_name}
                          </p>
                          <p className="text-sm text-orange-700">
                            Allergies: {alert.children.allergies}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Attendance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="py-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => navigate('/attendance')}>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Manage Attendance
              </Button>
              <Button variant="outline" onClick={() => navigate('/children')}>
                <Users className="mr-2 h-4 w-4" />
                View All Children
              </Button>
              <Button variant="outline" onClick={() => navigate('/classes')}>
                <Calendar className="mr-2 h-4 w-4" />
                Manage Classes
              </Button>
              <Button variant="outline" onClick={() => navigate('/reports')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default StaffDashboard;
