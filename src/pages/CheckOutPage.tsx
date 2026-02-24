
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, QrCode, LogOut, Clock, Loader2 } from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

const CheckOutPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { attendance, isLoading, checkOut, isCheckingOut } = useAttendance();

  // Filter to only today's currently checked-in children
  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = attendance.filter(
    (a) => a.attendance_date === today && a.checked_in_at && !a.checked_out_at
  );

  const filtered = checkedInToday.filter((a) => {
    if (!searchTerm) return true;
    const name = `${a.child?.first_name || ''} ${a.child?.last_name || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Child Check-Out</h1>
          <p className="text-muted-foreground">Search and check out children currently present</p>
        </div>

        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by child's name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Currently Checked In ({checkedInToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No matching children found.' : 'No children currently checked in.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {record.child?.first_name} {record.child?.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Checked in at {record.checked_in_at ? format(new Date(record.checked_in_at), 'h:mm a') : 'N/A'}
                      </div>
                      {record.class && (
                        <Badge variant="secondary" className="text-xs">
                          {(record.class as any).name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isCheckingOut}
                      onClick={() => checkOut(record.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Check Out
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CheckOutPage;
