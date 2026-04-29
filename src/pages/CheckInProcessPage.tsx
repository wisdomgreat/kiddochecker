
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Clock, BarChart3, Calendar, UserCheck } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { useClasses } from '@/hooks/useClasses';
import { useAttendance } from '@/hooks/useAttendance';
import { useDatabaseFunctions } from '@/hooks/useDatabaseFunctions';

const CheckInProcessPage = () => {
  const [activeTab, setActiveTab] = useState('checkin');
  const { executeFunction } = useDatabaseFunctions();
  const { children, isLoading: childrenLoading } = useChildren();
  const { classes, isLoading: classesLoading } = useClasses();
  const { attendance, checkIn, checkOut, isCheckingIn, isCheckingOut } = useAttendance();
  const [todayStats, setTodayStats] = useState({
    totalCheckins: 0,
    currentlyPresent: 0,
    notCheckedIn: 0
  });
  
  // Check-in states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Check-out states
  const [checkoutSearchTerm, setCheckoutSearchTerm] = useState('');

  useEffect(() => {
    const fetchAttendanceStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const totalCheckins = attendance.filter(a => a.attendance_date === today).length;
        const currentlyPresent = attendance.filter(a => !a.checked_out_at && a.attendance_date === today).length;
        const notCheckedIn = children.length - currentlyPresent;
        
        setTodayStats({
          totalCheckins,
          currentlyPresent,
          notCheckedIn: notCheckedIn >= 0 ? notCheckedIn : 0
        });
      } catch (error) {
        console.error("Error fetching attendance stats:", error);
      }
    };
    
    fetchAttendanceStats();
  }, [attendance, children]);

  // Filter out children who are already checked in
  const availableChildren = children.filter(child => {
    const isAlreadyCheckedIn = attendance.some(record => 
      record.child_id === child.id && !record.checked_out_at
    );
    return !isAlreadyCheckedIn;
  });

  const filteredChildren = availableChildren.filter(child =>
    `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get checked-in children for checkout
  const checkedInChildren = attendance.filter(record => 
    !record.checked_out_at && 
    record.child &&
    `${record.child.first_name || ''} ${record.child.last_name || ''}`.toLowerCase().includes(checkoutSearchTerm.toLowerCase())
  );
  
  const handleCheckIn = () => {
    if (selectedChild) {
      checkIn({ 
        childId: selectedChild, 
        classId: selectedClass === 'no-class' ? undefined : selectedClass 
      });
      setSelectedChild('');
      setSelectedClass('');
      setSearchTerm('');
    }
  };

  if (childrenLoading || classesLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading check-in data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Check-In & Check-Out Process</h1>
            <p className="text-muted-foreground">
              Manage child attendance in one place
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View History
            </Button>
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Attendance Report
            </Button>
          </div>
        </div>

        {/* Daily stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <UserPlus className="h-4 w-4 text-blue-600 mr-2" />
                Total Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayStats.totalCheckins}</div>
              <p className="text-sm text-muted-foreground">Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                Currently Present
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {todayStats.currentlyPresent}
              </div>
              <p className="text-sm text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Badge variant="outline" className="mr-2">Available</Badge>
                Not Checked In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {todayStats.notCheckedIn}
              </div>
              <p className="text-sm text-muted-foreground">Children</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checkin" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Check In</span>
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Check Out</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Check-In</CardTitle>
                <CardDescription>
                  Search for a child and check them in to a specific class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Child</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
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
                    <label className="text-sm font-medium mb-2 block">Select Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-class">No specific class</SelectItem>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleCheckIn} 
                    disabled={!selectedChild || isCheckingIn}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isCheckingIn ? 'Checking In...' : 'Check In'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Children</CardTitle>
                <CardDescription>Children who are not yet checked in today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChildren.slice(0, 9).map((child) => (
                    <div 
                      key={child.id}
                      className="border p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedChild(child.id)}
                    >
                      <div className="font-medium">{child.first_name} {child.last_name}</div>
                      <div className="text-sm text-gray-500">
                        {child.age ? `Age: ${child.age}` : 'No age recorded'}
                      </div>
                      {child.allergies && (
                        <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                          Allergies
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {filteredChildren.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      All children are already checked in or no children match your search
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Check Out Children</CardTitle>
                <CardDescription>Search and check out children who are currently present</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search checked-in children..."
                      value={checkoutSearchTerm}
                      onChange={(e) => setCheckoutSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {checkedInChildren.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.class?.name || 'No Class'} • 
                            Checked in: {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => checkOut(record.id)}
                          disabled={isCheckingOut}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      </div>
                    ))}
                    
                    {checkedInChildren.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {checkoutSearchTerm ? 'No matching children found' : 'No children checked in'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CheckInProcessPage;

