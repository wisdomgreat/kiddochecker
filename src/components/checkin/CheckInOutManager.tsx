
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAttendance } from '@/hooks/useAttendance';
import { useChildren } from '@/hooks/useChildren';
import { Search, UserPlus, LogOut, Users, Clock, QrCode } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/useClasses';

export const CheckInOutManager: React.FC = () => {
  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut } = useAttendance();
  const { children } = useChildren();
  const { classes } = useClasses();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(record => record.attendance_date === today);
  
  // Filter available children (not already checked in today)
  const availableChildren = children.filter(child => {
    const isCheckedIn = todayAttendance.some(record => 
      record.child_id === child.id && !record.checked_out_at
    );
    return !isCheckedIn;
  });

  // Filter children for search
  const filteredChildren = availableChildren.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Currently present children
  const presentChildren = todayAttendance.filter(record => !record.checked_out_at);

  const handleCheckIn = async () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child to check in",
        variant: "destructive",
      });
      return;
    }

    try {
      await checkIn({
        childId: selectedChild,
        classId: (selectedClass && selectedClass !== 'none') ? selectedClass : undefined
      });
      
      // Reset selections
      setSelectedChild('');
      setSelectedClass('');
      setSearchTerm('');
      
      toast({
        title: "Success",
        description: "Child checked in successfully",
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Error",
        description: "Failed to check in child",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      await checkOut(attendanceId);
      toast({
        title: "Success",
        description: "Child checked out successfully",
      });
    } catch (error) {
      console.error('Check-out error:', error);
      toast({
        title: "Error",
        description: "Failed to check out child",
        variant: "destructive",
      });
    }
  };

  const openKioskMode = () => {
    const url = '/check-in-kiosk';
    window.open(url, '_blank', 'fullscreen=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=no');
  };

  const openCheckOutStation = () => {
    const url = '/checkout';
    window.open(url, '_blank', 'fullscreen=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=no');
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentChildren.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayAttendance.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <LogOut className="h-4 w-4 mr-2 text-orange-600" />
              Checked Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {todayAttendance.filter(r => r.checked_out_at).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <QrCode className="h-4 w-4 mr-2 text-purple-600" />
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{availableChildren.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kiosk Mode Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={openKioskMode} className="bg-blue-600 hover:bg-blue-700">
          <QrCode className="h-4 w-4 mr-2" />
          Open Check-In Kiosk
        </Button>
        <Button onClick={openCheckOutStation} className="bg-orange-600 hover:bg-orange-700">
          <LogOut className="h-4 w-4 mr-2" />
          Open Check-Out Station
        </Button>
      </div>

      {/* Quick Check-In */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Quick Check-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Child</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Child</label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose child" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChildren.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class (Optional)</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific class</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCheckIn}
                disabled={!selectedChild || isCheckingIn}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCheckingIn ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currently Present Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Currently Present ({presentChildren.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {presentChildren.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No children currently present
            </div>
          ) : (
            <div className="space-y-3">
              {presentChildren.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {record.child?.first_name} {record.child?.last_name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">
                        {record.class?.name || 'No Class'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        In: {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCheckOut(record.id)}
                    disabled={isCheckingOut}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Check Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

