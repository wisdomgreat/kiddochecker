
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, LogIn, LogOut, Search } from "lucide-react";
import { AttendanceRecord } from "@/hooks/useAttendance";
import { format } from "date-fns";

interface AttendanceTableProps {
  attendance: AttendanceRecord[];
  onCheckOut: (attendanceId: string) => void;
  isCheckingOut: boolean;
  showCheckOut?: boolean;
}

const AttendanceTable = ({ 
  attendance, 
  onCheckOut, 
  isCheckingOut, 
  showCheckOut = true 
}: AttendanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAttendance = attendance.filter(record => {
    const childName = `${record.children?.first_name || ''} ${record.children?.last_name || ''}`.toLowerCase();
    return childName.includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), 'HH:mm');
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.checked_out_at) {
      return <Badge variant="secondary">Checked Out</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Present</Badge>;
  };

  const currentlyPresent = attendance.filter(record => !record.checked_out_at);
  const checkedOut = attendance.filter(record => record.checked_out_at);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium ml-2">
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendance.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <LogIn className="h-4 w-4 text-green-600" />
            <CardTitle className="text-sm font-medium ml-2">
              Currently Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentlyPresent.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <LogOut className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-medium ml-2">
              Checked Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{checkedOut.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search children..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead>Check-out Time</TableHead>
                <TableHead>Status</TableHead>
                {showCheckOut && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.children?.first_name} {record.children?.last_name}
                  </TableCell>
                  <TableCell>
                    {record.classes?.name || 'No class assigned'}
                  </TableCell>
                  <TableCell>{formatTime(record.checked_in_at)}</TableCell>
                  <TableCell>{formatTime(record.checked_out_at)}</TableCell>
                  <TableCell>{getStatusBadge(record)}</TableCell>
                  {showCheckOut && (
                    <TableCell>
                      {!record.checked_out_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCheckOut(record.id)}
                          disabled={isCheckingOut}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredAttendance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No children found matching your search.' : 'No attendance records for today.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTable;
