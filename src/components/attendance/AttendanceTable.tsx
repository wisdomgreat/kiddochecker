
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';

interface AttendanceTableProps {
  attendance: AttendanceRecord[];
  onCheckOut: (attendanceId: string) => void;
  isCheckingOut: boolean;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendance,
  onCheckOut,
  isCheckingOut
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No attendance records for today
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.child ? 
                      `${record.child.first_name} ${record.child.last_name}` : 
                      'Unknown Child'
                    }
                  </TableCell>
                  <TableCell>
                    {record.class?.name || 'No Class'}
                  </TableCell>
                  <TableCell>
                    {record.checked_in_at ? formatTime(record.checked_in_at) : '-'}
                  </TableCell>
                  <TableCell>
                    {record.checked_out_at ? (
                      <Badge variant="secondary">
                        Checked Out ({formatTime(record.checked_out_at)})
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600">Present</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!record.checked_out_at && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCheckOut(record.id)}
                        disabled={isCheckingOut}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {isCheckingOut ? 'Checking Out...' : 'Check Out'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
