import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Users, Clock } from 'lucide-react';

const ClassesPage = () => {
  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any, 'staff', 'teacher']}>
      <UnifiedDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
              <p className="text-muted-foreground">Manage classes and schedules</p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Active classes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">240</div>
                <p className="text-xs text-muted-foreground">Maximum children</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Enrollment</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">186</div>
                <p className="text-xs text-muted-foreground">77% capacity</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Toddlers (18m-2y)", capacity: 12, enrolled: 8, teacher: "Sarah Johnson" },
              { name: "Preschool (3-4y)", capacity: 20, enrolled: 15, teacher: "Mike Davis" },
              { name: "Kindergarten (5-6y)", capacity: 25, enrolled: 22, teacher: "Lisa Wilson" },
              { name: "Elementary (7-10y)", capacity: 30, enrolled: 28, teacher: "John Smith" },
              { name: "Youth (11-14y)", capacity: 35, enrolled: 30, teacher: "Emily Brown" },
              { name: "Teen (15-18y)", capacity: 40, enrolled: 35, teacher: "David Miller" }
            ].map((classInfo, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{classInfo.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Teacher:</span>
                    <span className="text-sm font-medium">{classInfo.teacher}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capacity:</span>
                    <span className="text-sm font-medium">{classInfo.capacity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Enrolled:</span>
                    <span className="text-sm font-medium">{classInfo.enrolled}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(classInfo.enrolled / classInfo.capacity) * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default ClassesPage;