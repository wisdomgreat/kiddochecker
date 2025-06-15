
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, TrendingUp, Calendar } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useChildren } from "@/hooks/useChildren";

const AttendanceSummary = () => {
  const { attendance } = useAttendance();
  const { children } = useChildren();

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => record.attendance_date === today);
  
  // Calculate stats
  const totalCheckedIn = todayAttendance.filter(record => !record.checked_out_at).length;
  const totalProcessed = todayAttendance.length;
  const averageCheckInTime = todayAttendance.length > 0 ? 
    todayAttendance.reduce((acc, record) => {
      if (record.checked_in_at) {
        const time = new Date(record.checked_in_at).getHours();
        return acc + time;
      }
      return acc;
    }, 0) / todayAttendance.length : 0;

  // Get last 7 days attendance trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const weeklyTrend = last7Days.map(date => {
    const dayAttendance = attendance.filter(record => record.attendance_date === date);
    return dayAttendance.length;
  });

  const averageWeeklyAttendance = weeklyTrend.reduce((a, b) => a + b, 0) / 7;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Currently Present */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currently Present</CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{totalCheckedIn}</div>
          <p className="text-xs text-muted-foreground">
            {totalProcessed} total check-ins today
          </p>
        </CardContent>
      </Card>

      {/* Total Children */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Children</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{children.length}</div>
          <p className="text-xs text-muted-foreground">
            Registered in system
          </p>
        </CardContent>
      </Card>

      {/* Peak Check-in Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Check-in Time</CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {averageCheckInTime > 0 ? `${Math.round(averageCheckInTime)}:00` : '--'}
          </div>
          <p className="text-xs text-muted-foreground">
            Average arrival time
          </p>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {averageWeeklyAttendance.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Daily average this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceSummary;
