import { useState, useMemo } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Search, MoreHorizontal, Edit, Trash2, Loader2, Shield, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityGroupManager } from '@/components/users/SecurityGroupManager';
import { SecurityGroupAssignmentDialog } from '@/components/users/SecurityGroupAssignmentDialog';
import { CleanUserCreationModal } from '@/components/admin/CleanUserCreationModal';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import DeleteUserDialog from '@/components/users/DeleteUserDialog';
import useUserRoles from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/users';
import { AppRole } from '@/types/supabase';

const UsersPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { data: users = [], isLoading, error, refetch } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserProfile | null>(null);
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
    const staff = users.filter(u => ['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin'].includes(u.role)).length;
    return { total, parents, staff };
  }, [users]);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await supabase.from('user_roles').delete().eq('user_id', deletingUser.id);
      toast({ title: "User Access Revoked", description: `${deletingUser.firstName} has been removed.` });
      setDeletingUser(null);
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
            <p className="text-sm text-muted-foreground">Manage identities and base roles for the system.</p>
          </div>
          <CleanUserCreationModal onUserCreated={() => refetch()} />
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

      <Card className="shadow-sm overflow-hidden">
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
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[180px]"
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="px-6 h-12 font-bold text-[10px] uppercase tracking-wider">Identity</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">Communication</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">Permission</TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-wider">State</TableHead>
                    <TableHead className="px-6 h-12 text-right font-bold text-[10px] uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{user.firstName} {user.lastName}</span>
                          {user.isSuperAdmin && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
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
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => setEditingUser({
                              id: user.id,
                              email: user.email,
                              first_name: user.firstName,
                              last_name: user.lastName,
                              role: user.role as AppRole,
                              is_super_admin: user.isSuperAdmin
                            })}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => setAssigningUser(user)}>
                              <Lock className="h-3.5 w-3.5 mr-2" /> Security Groups
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(user)}
                              className="text-xs font-bold text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Revoke Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
