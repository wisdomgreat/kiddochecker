
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, Users, Settings } from 'lucide-react';

const RolesPage = () => {
  const [roles] = useState([
    { id: '1', name: 'Super Admin', description: 'Full system access', userCount: 1, color: 'bg-red-100 text-red-800' },
    { id: '2', name: 'Admin', description: 'Administrative access', userCount: 3, color: 'bg-purple-100 text-purple-800' },
    { id: '3', name: 'Teacher', description: 'Classroom management', userCount: 8, color: 'bg-blue-100 text-blue-800' },
    { id: '4', name: 'Teacher Assistant', description: 'Assistant role', userCount: 5, color: 'bg-green-100 text-green-800' },
    { id: '5', name: 'Staff', description: 'General staff access', userCount: 2, color: 'bg-yellow-100 text-yellow-800' },
    { id: '6', name: 'Parent', description: 'Parent access', userCount: 25, color: 'bg-gray-100 text-gray-800' },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions for your organization.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">Available roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Assigned users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Settings className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">24</div>
              <p className="text-xs text-muted-foreground">Available permissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <Badge className={role.color}>
                    {role.userCount} users
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RolesPage;
