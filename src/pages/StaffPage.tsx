
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, UserCheck, Shield } from 'lucide-react';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import StaffCard from '@/components/staff/StaffCard';
import AddStaffForm from '@/components/staff/AddStaffForm';

const StaffPage = () => {
  const { staff, addStaff, isLoading, isAddingStaff } = useStaffManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredStaff = staff.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = (staffData: any) => {
    console.log('Adding staff:', staffData);
    addStaff(staffData);
    setShowAddForm(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's staff members and their roles.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium ml-2">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Shield className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium ml-2">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {staff.filter(member => member.role === 'admin').length}
              </div>
              <p className="text-xs text-muted-foreground">Administrative access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-medium ml-2">Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {staff.filter(member => member.role === 'teacher' || member.role === 'teacher_assistant').length}
              </div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredStaff.length > 0 ? (
            filteredStaff.map((member) => (
              <StaffCard key={member.user_id} member={member} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No staff members found matching your search.' : 'No staff members added yet.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Staff Member
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Add Staff Form */}
        <AddStaffForm
          open={showAddForm}
          onOpenChange={setShowAddForm}
          onSuccess={() => {
            setShowAddForm(false);
            console.log('Staff added successfully');
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default StaffPage;
