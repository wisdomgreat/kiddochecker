
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock } from 'lucide-react';

const AttendancePage = () => {
  const attendanceData = [
    { name: 'John Doe', class: 'Youth Group', checkIn: '9:00 AM', status: 'Present' },
    { name: 'Jane Smith', class: 'Children Ministry', checkIn: '9:15 AM', status: 'Present' },
    { name: 'Mike Johnson', class: 'Youth Group', checkIn: '9:30 AM', status: 'Present' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Attendance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-muted-foreground">Total Present</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Late Arrivals</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-sm text-muted-foreground">Absent</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Today's Attendance</h3>
              <div className="space-y-2">
                {attendanceData.map((person, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.class}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm">{person.checkIn}</div>
                      <Badge variant="secondary">{person.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendancePage;
