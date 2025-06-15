
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, UserPlus, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { getUserTableColumns } from '@/components/users/UserTableColumns';
import useUserRoles from '@/hooks/useUserRoles';
import { UserProfile } from '@/types/users';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'parent' as const,
    phone: ''
  });
  const { toast } = useToast();
  const { data: users = [], isLoading, refetch } = useUserRoles();

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log("Creating user:", newUserForm);
      
      // Create user with admin privileges using service role
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: 'TempPass123!',
        email_confirm: true,
        user_metadata: {
          first_name: newUserForm.firstName,
          last_name: newUserForm.lastName,
          phone: newUserForm.phone
        }
      });

      if (authError) {
        console.error("Error creating user:", authError);
        throw authError;
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            first_name: newUserForm.firstName,
            last_name: newUserForm.lastName,
            phone: newUserForm.phone
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Create user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: newUserForm.role
          });

        if (roleError) {
          console.error("Error creating role:", roleError);
        }
      }

      toast({
        title: "Success",
        description: "User created successfully! They will receive an email to set their password.",
      });

      setNewUserForm({ email: '', firstName: '', lastName: '', role: 'parent', phone: '' });
      refetch(); // Refresh the user list
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    toast({
      title: "Edit User",
      description: `Editing ${user.firstName} ${user.lastName} (Feature coming soon)`,
    });
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User ${user.firstName} ${user.lastName} deleted successfully`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userColumns = getUserTableColumns({
    onEdit: handleEditUser,
    onDelete: handleDeleteUser
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, their roles, and permissions.
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Create User</TabsTrigger>
            <TabsTrigger value="manage">Manage Users</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      placeholder="Enter first name"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      placeholder="Enter last name"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newUserForm.role} onValueChange={(value: any) => setNewUserForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreateUser}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={() => refetch()} variant="outline">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
                    <span>Loading users...</span>
                  </div>
                ) : (
                  <DataTable
                    columns={userColumns}
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    searchable={false}
                    loading={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
