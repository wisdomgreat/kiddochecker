import { useState, useMemo } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Users, Search, MoreHorizontal, Edit, Trash2, Loader2, Shield, Lock, KeyRound, UserCheck, UserX, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityGroupManager } from '@/components/users/SecurityGroupManager';
import { SecurityGroupAssignmentDialog } from '@/components/users/SecurityGroupAssignmentDialog';
import { CleanUserCreationModal } from '@/components/admin/CleanUserCreationModal';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { ChangePasswordDialog } from '@/components/users/ChangePasswordDialog';
import DeleteUserDialog from '@/components/users/DeleteUserDialog';
import useUserRoles from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { apiFetch } from '@/lib/apiClient';
import { UserProfile } from '@/types/users';
import { AppRole } from '@/types/supabase';

const UsersPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { data: users = [], isLoading, error, refetch } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const { toast } = useToast();

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

  const stats = useMemo(() => {
    const total = users.length;
    const parents = users.filter(u => u.role === 'parent').length;
    const staff = users.filter(u => ['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin', 'volunteer'].includes(u.role)).length;
    return { total, parents, staff };
  }, [users]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

  // Single User Full Deletion
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      // Direct full account deletion via profiles table mutation
      const { error } = await supabase.from('profiles').delete().eq('id', deletingUser.id);
      if (error) throw error;

      toast({ 
        title: "Account Revoked & Deleted", 
        description: `Permanently removed ${deletingUser.firstName} ${deletingUser.lastName}'s account.` 
      });
      setDeletingUser(null);
      setSelectedUserIds(prev => prev.filter(id => id !== deletingUser.id));
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
    }
  };

  // Single User Status Toggle
  const handleToggleUserActive = async (user: UserProfile) => {
    try {
      const nextState = !user.isActive;
      const { error } = await supabase.from('profiles').update({ is_active: nextState }).eq('id', user.id);
      if (error) throw error;

      toast({
        title: nextState ? "Account Activated" : "Account Deactivated",
        description: `${user.firstName} ${user.lastName}'s status updated to ${nextState ? 'Active' : 'Inactive'}.`,
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update account status", variant: "destructive" });
    }
  };

  // Bulk Actions Handlers
  const handleBulkChangeRole = async (newRole: string) => {
    if (selectedUserIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await apiFetch('/api/admin/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'change_role',
          user_ids: selectedUserIds,
          data: { role: newRole }
        })
      });

      toast({
        title: "Bulk Role Updated",
        description: `Successfully updated ${selectedUserIds.length} users to role '${formatRole(newRole)}'.`,
      });
      setSelectedUserIds([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Bulk Action Error", description: err.message, variant: "destructive" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkToggleActive = async (isActive: boolean) => {
    if (selectedUserIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await apiFetch('/api/admin/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'toggle_active',
          user_ids: selectedUserIds,
          data: { is_active: isActive }
        })
      });

      toast({
        title: isActive ? "Accounts Activated" : "Accounts Deactivated",
        description: `Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedUserIds.length} accounts.`,
      });
      setSelectedUserIds([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Bulk Action Error", description: err.message, variant: "destructive" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE all ${selectedUserIds.length} selected user accounts? This cannot be undone.`)) {
      return;
    }
    setIsBulkDeleting(true);
    try {
      await apiFetch('/api/admin/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'delete',
          user_ids: selectedUserIds
        })
      });

      toast({
        title: "Accounts Deleted",
        description: `Successfully deleted ${selectedUserIds.length} user accounts.`,
      });
      setSelectedUserIds([]);
      refetch();
    } catch (err: any) {
      toast({ title: "Bulk Delete Error", description: err.message, variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin': return 'destructive';
      case 'staff': return 'default';
      case 'teacher': return 'secondary';
      default: return 'outline';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const userManagementContent = (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">User Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage identities, credentials, security roles, and bulk access.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 font-semibold">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <CleanUserCreationModal onUserCreated={() => refetch()} />
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Total Accounts", val: stats.total, desc: "Active system users" },
          { label: "Families", val: stats.parents, desc: "Parent accounts" },
          { label: "Authorities", val: stats.staff, desc: "Staff & Admins" }
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <div className="text-3xl font-bold">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : s.val}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Management Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5" />
            <span className="font-bold text-sm">{selectedUserIds.length} accounts selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={(role) => handleBulkChangeRole(role)} disabled={isBulkUpdating}>
              <SelectTrigger className="w-[160px] h-9 bg-primary-foreground text-foreground font-semibold text-xs">
                <SelectValue placeholder="Set Bulk Role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Set Role: Parent</SelectItem>
                <SelectItem value="staff">Set Role: Staff</SelectItem>
                <SelectItem value="teacher">Set Role: Teacher</SelectItem>
                <SelectItem value="volunteer">Set Role: Volunteer</SelectItem>
                <SelectItem value="admin">Set Role: Admin</SelectItem>
                <SelectItem value="super_admin">Set Role: Super Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkToggleActive(true)}
              disabled={isBulkUpdating}
              className="gap-1 font-semibold text-xs h-9"
            >
              <UserCheck className="h-4 w-4" /> Activate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkToggleActive(false)}
              disabled={isBulkUpdating}
              className="gap-1 font-semibold text-xs h-9 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
            >
              <UserX className="h-4 w-4" /> Deactivate
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting || isBulkUpdating}
              className="gap-1 font-semibold text-xs h-9 bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Selected
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
              className="text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-9"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card className="shadow-sm overflow-hidden border">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">System Users</CardTitle>
              <CardDescription>Filtering {filteredUsers.length} matched profiles.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[220px]"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-10 px-4 h-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      />
                    </TableHead>
                    <TableHead className="px-4 h-12 font-bold text-[10px] uppercase tracking-wider">Identity</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">Communication</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">Permission</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">State</TableHead>
                    <TableHead className="px-6 h-12 text-right font-bold text-[10px] uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No user profiles match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      return (
                        <TableRow key={user.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-muted/50' : ''}`}>
                          <TableCell className="w-10 px-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectUser(user.id, Boolean(checked))}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{user.firstName} {user.lastName}</span>
                              {user.isSuperAdmin && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="font-bold text-[10px] h-5">
                              {formatRole(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge variant="default" className="bg-emerald-600 font-bold text-[10px] h-5">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="font-bold text-[10px] h-5">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem 
                                  className="text-xs font-semibold" 
                                  onClick={() => setEditingUser({
                                    id: user.id,
                                    email: user.email,
                                    first_name: user.firstName,
                                    last_name: user.lastName,
                                    phone: user.phone,
                                    role: user.role as AppRole,
                                    is_super_admin: user.isSuperAdmin
                                  })}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-2" /> Edit Details
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className="text-xs font-semibold"
                                  onClick={() => setPasswordUser(user)}
                                >
                                  <KeyRound className="h-3.5 w-3.5 mr-2 text-amber-500" /> Change Password
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className="text-xs font-semibold" 
                                  onClick={() => setAssigningUser(user)}
                                >
                                  <Lock className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Security Groups
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                  className="text-xs font-semibold"
                                  onClick={() => handleToggleUserActive(user)}
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="h-3.5 w-3.5 mr-2 text-orange-500" /> Deactivate Account
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Activate Account
                                    </>
                                  )}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => setDeletingUser(user)}
                                  className="text-xs font-semibold text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Revoke & Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const securityGroupsContent = (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Security Governance</h1>
          <p className="text-sm text-muted-foreground">Manage granular permissions via additive security groups.</p>
        </div>
      </div>
      <SecurityGroupManager />
    </div>
  );

  const pageContent = (
    <Tabs defaultValue="users" className="w-full">
      <div className="border-b bg-card px-6">
        <TabsList className="bg-transparent h-14 p-0 gap-8">
          <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold text-sm">
            <Users className="h-4 w-4 mr-2" /> User Management
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 font-bold text-sm">
            <Shield className="h-4 w-4 mr-2" /> Security Groups
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="users" className="m-0 border-none p-0">
        {userManagementContent}
      </TabsContent>
      <TabsContent value="groups" className="m-0 border-none p-0">
        {securityGroupsContent}
      </TabsContent>
    </Tabs>
  );

  return (
    <UnifiedDashboardLayout>
      <div className="bg-background min-h-screen">
        {isEmbedded ? userManagementContent : pageContent}
      </div>
      
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={() => {
          setEditingUser(null);
          refetch();
        }}
      />

      <ChangePasswordDialog
        user={passwordUser}
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
        onSuccess={() => {
          setPasswordUser(null);
          refetch();
        }}
      />

      <SecurityGroupAssignmentDialog
        user={assigningUser}
        open={!!assigningUser}
        onOpenChange={(open) => !open && setAssigningUser(null)}
        onSuccess={() => {
          setAssigningUser(null);
          refetch();
        }}
      />

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
  );
};

export default UsersPage;
