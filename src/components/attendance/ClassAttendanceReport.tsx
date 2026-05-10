import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClassAttendanceReportProps {
  selectedDate: string;
}

interface ClassStat {
  class_id: string;
  class_name: string;
  total_children: number;
  checked_in_count: number;
  currently_present: number;
}

export const ClassAttendanceReport = ({ selectedDate }: ClassAttendanceReportProps) => {
  const { data: classStats = [], isLoading } = useQuery({
    queryKey: ['class-attendance-stats', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_attendance_summary_secure', {
        p_date: selectedDate
      });

      if (error) throw error;
      return (data || []) as ClassStat[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Loading class statistics...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Class Attendance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {classStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No class attendance data for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classStats.map((classStat) => {
              const attendanceRate = classStat.total_children > 0
                ? Math.round((classStat.checked_in_count / classStat.total_children) * 100)
                : 0;

              return (
                <div key={classStat.class_id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {classStat.class_name || 'No Class'}
                    </h4>
                    <Badge variant={attendanceRate >= 80 ? 'default' : 'secondary'}>
                      {attendanceRate}% Rate
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {classStat.total_children}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Checked In</p>
                      <p className="text-lg font-semibold text-green-600">
                        {classStat.checked_in_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Present Now</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {classStat.currently_present}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

