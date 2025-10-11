import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Mail } from 'lucide-react';
import { useStaff } from '@/hooks/useStaff';
import { Badge } from '@/components/ui/badge';

const StaffPage = () => {
  const { staff, isLoading } = useStaff();

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading staff members...</p>
              </CardContent>
            </Card>
          ) : staff && staff.length > 0 ? (
            staff.map((member: any) => (
              <Card key={member.user_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {member.first_name} {member.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {member.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first staff member
                </p>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default StaffPage;
