import { useState, useMemo } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import RoleBasedRoute from '@/components/layout/RoleBasedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserPlus, Search, MoreHorizontal, Edit, Trash2, Loader2, Shield } from 'lucide-react';
import { CleanUserCreationModal } from '@/components/admin/CleanUserCreationModal';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import DeleteUserDialog from '@/components/users/DeleteUserDialog';
import useUserRoles from '@/hooks/useUserRoles';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/users';
import { AppRole } from '@/types/supabase';

const UsersPage = () => {
  const { data: users = [], isLoading, error, refetch } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter users based on search and role filter
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = users.length;
    const parents = users.filter(u => u.role === 'parent').length;
    const staff = users.filter(u => ['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin'].includes(u.role)).length;
    return { total, parents, staff };
  }, [users]);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      // Delete user role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.id);
      
      if (roleError) {
        console.error('Error deleting user role:', roleError);
      }
      
      // Note: We can't delete from auth.users directly via client
      // The user role deletion is sufficient to revoke access
      
      toast({
        title: "User Removed",
        description: `${deletingUser.firstName} ${deletingUser.lastName} has been removed from the system.`,
      });
      
      setDeletingUser(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'destructive';
      case 'staff':
        return 'default';
      case 'teacher':
        return 'secondary';
      case 'parent':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <RoleBasedRoute allowedRoles={['admin', 'super_admin' as any]}>
      <UnifiedDashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage all users in your organization</p>
            </div>
            <CleanUserCreationModal onUserCreated={() => refetch()} />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
                </div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.parents}
                </div>
                <p className="text-xs text-muted-foreground">Parent accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.staff}
                </div>
                <p className="text-xs text-muted-foreground">Teachers, staff, and admins</p>
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <CardTitle>All Users</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <p>Error loading users</p>
                  <Button variant="outline" onClick={() => refetch()} className="mt-2">
                    Retry
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                  <p className="text-sm">Try adjusting your search or filter</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {user.isSuperAdmin && (
                              <Shield className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingUser({
                                id: user.id,
                                email: user.email,
                                first_name: user.firstName,
                                last_name: user.lastName,
                                role: user.role as AppRole,
                                is_super_admin: user.isSuperAdmin
                              })}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingUser(user)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit User Dialog */}
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            refetch();
          }}
        />

        {/* Delete User Dialog */}
        <DeleteUserDialog
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          onDelete={handleDeleteUser}
          user={deletingUser}
          selectedUser={deletingUser}
        />
      </UnifiedDashboardLayout>
    </RoleBasedRoute>
  );
};

export default UsersPage;
