
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus,
  Search,
  Shield,
  User,
  Mail,
  Phone,
  CheckCircle,
  X,
  Edit,
  Trash2,
  RefreshCcw
} from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
}

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with roles
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      console.log('Fetching users with roles...');
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Users data received:', data);
      return data as UserWithRole[];
    },
    retry: 2,
    staleTime: 30000,
  });

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: UserWithRole) => {
    toast({
      title: "Edit User",
      description: "Edit functionality will be implemented soon",
    });
  };

  const handleDelete = (user: UserWithRole) => {
    toast({
      title: "Delete User",
      description: "Delete functionality will be implemented soon",
    });
  };

  const getRoleBadgeColor = (role: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) return 'bg-purple-100 text-purple-800';
    
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'teacher_assistant':
        return 'bg-teal-100 text-teal-800';
      case 'parent':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'email' as keyof UserWithRole,
      header: 'User',
      render: (value: string, item: UserWithRole) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">
              {item.first_name || item.last_name 
                ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
                : 'No name set'
              }
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {value}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role' as keyof UserWithRole,
      header: 'Role',
      render: (value: string, item: UserWithRole) => (
        <div className="flex flex-col gap-1">
          <Badge className={getRoleBadgeColor(value, item.is_super_admin)}>
            {item.is_super_admin ? 'Super Admin' : value.replace('_', ' ')}
          </Badge>
          {item.is_super_admin && (
            <div className="flex items-center text-xs text-purple-600">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'is_active' as keyof UserWithRole,
      header: 'Status',
      render: (value: boolean) => (
        <div className="flex items-center">
          {value ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-700">Active</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700">Inactive</span>
            </>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (value: any, item: UserWithRole) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDelete(item)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-8">
          <Card className="max-w-md">
            <CardContent className="text-center py-8">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Users</h3>
              <p className="text-sm text-gray-500 mb-4">{(error as Error).message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['users-with-roles'] })}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          <Button onClick={() => toast({ title: "Add User", description: "Add user functionality coming soon" })}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(user => user.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(user => user.role === 'admin' || user.is_super_admin).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents</CardTitle>
              <User className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {users.filter(user => user.role === 'parent').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>All Users</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No users found</h3>
                <p className="text-gray-600 mb-6">There are no users in the system yet.</p>
                <Button onClick={() => toast({ title: "Add User", description: "Add user functionality coming soon" })}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                searchable={false}
                loading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UsersManagement;
