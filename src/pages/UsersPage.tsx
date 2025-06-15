
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { getUserTableColumns } from '@/components/users/UserTableColumns';
import { UserCreationForm } from '@/components/users/UserCreationForm';
import useUserRoles from '@/hooks/useUserRoles';
import { UserProfile } from '@/types/users';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { data: users = [], isLoading, refetch } = useUserRoles();

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
              <CardContent>
                <UserCreationForm onUserCreated={refetch} />
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
