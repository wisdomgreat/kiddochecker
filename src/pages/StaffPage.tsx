
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import useUserRoles from '@/hooks/useUserRoles';
import { DataTable } from '@/components/ui/data-table';
import { getUserTableColumns } from '@/components/users/UserTableColumns';

const StaffPage = () => {
  const { toast } = useToast();
  const { data: users = [], refetch } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff' as const,
    phone: ''
  });

  const staffUsers = users.filter(user => 
    ['staff', 'teacher', 'teacher_assistant', 'admin'].includes(user.role)
  );

  const filteredStaff = staffUsers.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateStaff = async () => {
    if (!newStaff.email || !newStaff.firstName || !newStaff.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newStaff.email,
        password: 'TempPass123!',
        email_confirm: true,
        user_metadata: {
          first_name: newStaff.firstName,
          last_name: newStaff.lastName,
          phone: newStaff.phone
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: newStaff.firstName,
            last_name: newStaff.lastName,
            phone: newStaff.phone
          });

        if (profileError) console.error("Profile error:", profileError);

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: newStaff.role
          });

        if (roleError) console.error("Role error:", roleError);
      }

      toast({
        title: "Success",
        description: "Staff member created successfully!",
      });

      setNewStaff({ email: '', firstName: '', lastName: '', role: 'staff', phone: '' });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (user: any) => {
    toast({ title: "Edit", description: "Edit functionality coming soon" });
  };

  const handleDelete = (user: any) => {
    toast({ title: "Delete", description: "Delete functionality coming soon" });
  };

  const columns = getUserTableColumns({ onEdit: handleEdit, onDelete: handleDelete });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's staff members.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Add New Staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  placeholder="Enter first name"
                  value={newStaff.firstName}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Enter last name"
                  value={newStaff.lastName}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  placeholder="Enter phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select 
                  value={newStaff.role} 
                  onValueChange={(value: any) => setNewStaff(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateStaff} disabled={isCreating} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {isCreating ? "Creating..." : "Add Staff"}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <DataTable
                columns={columns}
                data={filteredStaff}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffPage;
