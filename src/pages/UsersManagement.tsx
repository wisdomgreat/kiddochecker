
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Edit2, Shield } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";
import RoleForm from "@/components/roles/RoleForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
}

const UsersManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'teacher_assistant': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      case 'parent': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleForm(true);
  };

  const handleRoleUpdate = async (values: any) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: values.role,
          is_super_admin: values.isSuperAdmin,
          is_volunteer: values.isVolunteer,
        })
        .eq('user_id', values.userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      refetch();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user accounts and roles</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="teacher_assistant">Teacher Assistant</option>
                  <option value="staff">Staff</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditRole(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                  {user.is_super_admin && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      <Shield className="h-3 w-3 mr-1" />
                      Super Admin
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={user.is_active ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        <RoleForm
          isOpen={showRoleForm}
          onOpenChange={setShowRoleForm}
          selectedUser={selectedUser}
          onSubmit={handleRoleUpdate}
        />
      </div>
    </SimpleLayout>
  );
};

export default UsersManagement;
