
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Shield, Users, UserPlus, Trash2, UserX, RefreshCw } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";
import RoleForm from "@/components/roles/RoleForm";
import ManagementHeader from "@/components/management/ManagementHeader";
import SearchAndFilter from "@/components/management/SearchAndFilter";
import EmptyState from "@/components/management/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { adminManageUser, logAuditEvent, PERMISSIONS } from "@/utils/permissionUtils";
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
  const [permissions, setPermissions] = useState({
    canManageRoles: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canSuspend: false
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const [manageRoles, create, edit, deleteUsers, suspend] = await Promise.all([
        canManageUserRoles(),
        canCreateUsers(),
        canEditUsers(),
        canDeleteUsers(),
        canSuspendUsers()
      ]);
      
      setPermissions({
        canManageRoles: manageRoles,
        canCreate: create,
        canEdit: edit,
        canDelete: deleteUsers,
        canSuspend: suspend
      });
    };
    
    checkPermissions();
  }, [canManageUserRoles, canCreateUsers, canEditUsers, canDeleteUsers, canSuspendUsers]);

  const roleFilterOptions = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "teacher", label: "Teacher" },
    { value: "teacher_assistant", label: "Teacher Assistant" },
    { value: "staff", label: "Staff" },
    { value: "parent", label: "Parent" },
  ];

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
    if (!permissions.canManageRoles) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage user roles.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUser(user);
    setShowRoleForm(true);
  };

  const handleDeleteUser = (user: User) => {
    if (!permissions.canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete users.",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const result = await adminManageUser('delete_user', userToDelete.id);
      
      if (result.success) {
        await logAuditEvent('delete_user', 'users', userToDelete.id, {
          user_email: userToDelete.email,
          user_name: `${userToDelete.first_name} ${userToDelete.last_name}`
        });
        
        toast({
          title: 'Success',
          description: `User ${userToDelete.first_name} ${userToDelete.last_name} has been deleted.`,
        });
        
        refetch();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
    
    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleSuspendUser = async (user: User) => {
    if (!permissions.canSuspend) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to suspend users.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const action = user.is_active ? 'suspend_user' : 'activate_user';
      const result = await adminManageUser(action, user.id);
      
      if (result.success) {
        await logAuditEvent(action, 'users', user.id, {
          user_email: user.email,
          previous_status: user.is_active ? 'active' : 'suspended'
        });
        
        toast({
          title: 'Success',
          description: `User ${user.is_active ? 'suspended' : 'activated'} successfully.`,
        });
        
        refetch();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user status',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleRoleUpdate = async (values: any) => {
    try {
      const result = await adminManageUser('update_role', values.userId, {
        role: values.role,
        is_super_admin: values.isSuperAdmin,
        is_volunteer: values.isVolunteer,
      });

      if (result.success) {
        await logAuditEvent('update_user_role', 'users', values.userId, {
          new_role: values.role,
          is_super_admin: values.isSuperAdmin,
          is_volunteer: values.isVolunteer
        });
        
        toast({
          title: 'Success',
          description: 'User role updated successfully',
        });

        refetch();
        setShowRoleForm(false);
        setSelectedUser(null);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user role',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="animate-spin h-8 w-8 border-b-2 border-gray-900" />
          <span className="ml-2">Loading users...</span>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ManagementHeader 
            title="User Management"
            description="Manage user accounts and roles with granular permissions"
          />
          {permissions.canCreate && (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
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
                      {permissions.canEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRole(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {permissions.canSuspend && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSuspendUser(user)}
                        >
                          <UserX className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
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

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? 
                This action cannot be undone and will permanently remove all user data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SimpleLayout>
  );
};

export default UsersManagement;
