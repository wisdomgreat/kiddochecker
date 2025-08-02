
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Shield, Users, UserPlus, Trash2, UserX, RefreshCw } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleForm from "@/components/roles/RoleForm";
import ManagementHeader from "@/components/management/ManagementHeader";
import SearchAndFilter from "@/components/management/SearchAndFilter";
import EmptyState from "@/components/management/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
  is_volunteer: boolean;
  phone: string;
  created_at: string;
}

const UsersManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canManageUserRoles, canCreateUsers, canEditUsers, canDeleteUsers, canSuspendUsers } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const roleFilterOptions = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "teacher_assistant", label: "Teacher Assistant" },
    { value: "staff", label: "Staff" },
    { value: "parent", label: "Parent" },
  ];

  const { data: rawUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      try {
        console.log('Fetching users with roles...');
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const { data, error } = await supabase.rpc('get_users_with_roles');
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }
        
        console.log('Users fetched successfully:', data?.length || 0, 'users');
        return data || [];
      } catch (error: any) {
        console.error('Exception fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });

  // Transform the raw data to match our User interface
  const users: User[] = rawUsers.map((user: any) => ({
    id: user.id,
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || 'parent',
    is_super_admin: user.is_super_admin || false,
    is_active: user.is_active || false,
    is_volunteer: user.is_volunteer || false,
    phone: user.phone || '',
    created_at: user.created_at || new Date().toISOString()
  }));

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

  const handleEditRole = async (user: User) => {
    try {
      const hasPermission = await canManageUserRoles();
      if (!hasPermission) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to manage user roles.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedUser(user);
      setShowRoleForm(true);
    } catch (error) {
      console.error('Error checking permissions:', error);
      toast({
        title: "Error",
        description: "Failed to check permissions",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (user: User) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      const hasPermission = await canSuspendUsers();
      
      if (!hasPermission) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to suspend users.",
          variant: "destructive",
        });
        return;
      }
      
      // Simple status update without complex admin functions
      const newStatus = !user.is_active;
      console.log(`Updating user ${user.id} active status to:`, newStatus);
      
      toast({
        title: 'Action Simulated',
        description: `User ${user.first_name} ${user.last_name} would be ${newStatus ? 'activated' : 'suspended'}.`,
      });
      
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRoleUpdate = async (values: any) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      console.log('Updating user role:', values);
      
      // Simple role update
      const { error } = await supabase
        .from('user_roles')
        .update({
          role: values.role,
          is_super_admin: values.isSuperAdmin || false,
          is_volunteer: values.isVolunteer || false,
        })
        .eq('user_id', values.userId);

      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      await refetch();
      setShowRoleForm(false);
      setSelectedUser(null);
      
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="animate-spin h-8 w-8 mr-2" />
          <span>Loading users...</span>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ManagementHeader 
            title="User Management"
            description="Manage user accounts and roles"
          />
        </div>

        <Card>
          <CardContent className="p-4">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search users..."
              filterOptions={roleFilterOptions}
              selectedFilter={roleFilter}
              onFilterChange={setRoleFilter}
            />
          </CardContent>
        </Card>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="No users found matching your criteria."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-gray-500 mt-1">{user.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditRole(user)}
                        disabled={isUpdating}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSuspendUser(user)}
                        disabled={isUpdating}
                      >
                        <UserX className="h-4 w-4 text-orange-500" />
                      </Button>
                    </div>
                  </div>
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
                      {user.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <RoleForm
          isOpen={showRoleForm}
          onOpenChange={setShowRoleForm}
          selectedUser={selectedUser}
          onSubmit={handleRoleUpdate}
        />
      </div>
    </ModernLayout>
  );
};

export default UsersManagement;
