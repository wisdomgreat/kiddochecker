
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit2, Trash2, Shield, Search, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { AppRole } from "@/types/supabase";
import { useAuth } from "@/context/AuthContext";

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  is_super_admin: boolean;
  is_active: boolean;
  is_volunteer: boolean;
  phone?: string;
  created_at: string;
}

const AdminUserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading, refetch, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        console.log('Fetching all users for admin...');
        
        const { data, error } = await supabase.rpc('get_users_with_roles');
        
        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }
        
        console.log('Admin users data:', data);
        
        return (data || []).map((user: any) => ({
          id: user.id,
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role as AppRole,
          is_super_admin: user.is_super_admin || false,
          is_active: user.is_active !== false, // Default to true if not specified
          is_volunteer: user.is_volunteer || false,
          phone: user.phone || '',
          created_at: user.created_at || new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error in admin user fetch:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    enabled: isAdmin,
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Refreshed',
      description: 'User data has been refreshed',
    });
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    toast({
      title: 'Delete User',
      description: `User deletion requires additional admin privileges`,
      variant: 'destructive',
    });
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'teacher_assistant': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      case 'parent': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500 text-center">You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Users</h3>
            <p className="text-gray-500 mb-4">There was an error loading the user data.</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage all users in the system</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Grid */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 text-center">No users match your current search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium text-sm">
                        {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {user.first_name || user.last_name ? 
                          `${user.first_name} ${user.last_name}`.trim() : 
                          'No Name'
                        }
                      </CardTitle>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                  {user.is_volunteer && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Volunteer
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
      )}

      <AddUserModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />

      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={selectedUser}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          refetch();
        }}
      />
    </div>
  );
};

export default AdminUserManagement;
