import React, { useState } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Edit, Trash2, Loader2, UserPlus, Users, Briefcase, Building2, Plus, Lock, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useStaff, type StaffMember } from '@/hooks/useStaff';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';

const StaffPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { user, userRole } = useAuth();
  const { staff, isLoading, addStaff, isAddingStaff, updateStaff, isUpdatingStaff } = useStaff();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isManagingGroup, setIsManagingGroup] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    is_volunteer: false,
    staff_pin: '',
    department: '',
    specialties: [] as string[],
    max_hours_per_week: 40,
    staff_groups: [] as string[],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['staff-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_groups').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ['staff-group-members-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_group_members')
        .select('group_id, profile_id');
      if (error) throw error;
      return data;
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (newGroup: { name: string, description: string }) => {
      const { data, error } = await supabase.from('staff_groups').insert([newGroup]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-groups'] });
      toast({ title: "Group Created", description: "Department/Group added successfully." });
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (updatedGroup: { id: string, name: string, description: string }) => {
      const { error } = await supabase.from('staff_groups').update({
        name: updatedGroup.name,
        description: updatedGroup.description
      }).eq('id', updatedGroup.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-groups'] });
      toast({ title: "Updated", description: "Department details updated." });
      setIsEditGroupDialogOpen(false);
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-groups'] });
      toast({ title: "Deleted", description: "Department removed successfully." });
      setIsDeleteGroupDialogOpen(false);
    }
  });

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'staff',
      is_volunteer: false,
      staff_pin: '',
      department: '',
      specialties: [],
      max_hours_per_week: 40,
      staff_groups: [],
    });
  };

  const filteredStaff = staff?.filter((member: StaffMember) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.role?.toLowerCase().includes(searchLower)
    );
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    addStaff({
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      role: formData.role as any,
      is_volunteer: formData.is_volunteer,
      staff_pin: formData.staff_pin,
      department: formData.department,
      specialties: formData.specialties,
      max_hours_per_week: formData.max_hours_per_week,
      staff_groups: formData.staff_groups,
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    if (userRole === 'admin' && formData.staff_pin !== selectedStaff.staff_pin && (selectedStaff.role === 'super_admin' || selectedStaff.is_super_admin)) {
        toast({ title: "Forbidden", description: "Only Super Admins can reset Super Admin settings.", variant: "destructive" });
        return;
    }

    updateStaff({
      userId: selectedStaff.user_id,
      updates: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        is_volunteer: formData.is_volunteer,
        staff_pin: formData.staff_pin,
        department: formData.department,
        specialties: formData.specialties,
        max_hours_per_week: formData.max_hours_per_week,
      }
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    if (userRole === 'admin' && (selectedStaff.role === 'super_admin' || selectedStaff.is_super_admin)) {
        toast({ title: "Forbidden", description: "Only Super Admins can remove other Super Admins.", variant: "destructive" });
        return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-user-management', {
        body: { action: 'delete_user', userId: selectedStaff.user_id }
      });
      if (error) throw error;
      toast({ title: "Success", description: "Staff member removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormData({
      email: member.email,
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      phone: member.phone || '',
      role: member.role,
      is_volunteer: member.is_volunteer,
      staff_pin: member.staff_pin || '',
      department: member.department || '',
      specialties: member.specialties || [],
      max_hours_per_week: member.max_hours_per_week || 40,
      staff_groups: groupMembers.filter((m: any) => m.profile_id === member.user_id).map((m: any) => m.group_id),
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'default';
      case 'teacher':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canResetPin = (target: StaffMember) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return !(target.role === 'super_admin' || target.is_super_admin);
    return false;
  };

  const content = (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-sm text-muted-foreground">Manage organization structure and personnel profiles.</p>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      )}

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            {t('teamRoster')}
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Briefcase className="h-4 w-4 mr-2" />
            {t('departmentsGroups')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search team..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="shadow-sm">
            <div className="divide-y">
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : filteredStaff && filteredStaff.length > 0 ? (
                filteredStaff.map((member: StaffMember) => (
                  <div key={member.user_id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        {member.avatar_url || member.photo_url ? (
                          <img src={member.avatar_url || member.photo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-6 w-6 text-muted-foreground/30" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold">{member.first_name} {member.last_name}</h3>
                          {member.department && (
                             <Badge variant="secondary" className="text-[10px] h-4">
                               {member.department}
                             </Badge>
                          )}
                         </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
                          <div className="flex items-center gap-1.5 font-mono text-[10px]">
                              <Lock className="h-3 w-3" />
                              {member.user_id === user?.id && member.staff_pin ? member.staff_pin : '••••'}
                          </div>
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={getRoleBadgeVariant(member.role)} className="font-bold text-[10px] uppercase">
                        {member.role?.replace('_', ' ')}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(member)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(member)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No personnel matches found</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 shadow-sm h-fit">
               <CardHeader>
                  <CardTitle className="text-lg font-bold">New Department</CardTitle>
                  <CardDescription>Logical grouping for permissions.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-4">
                      <div className="space-y-1.5">
                          <Label className="text-xs">Title</Label>
                          <Input id="group-name" placeholder="e.g. Operations" />
                      </div>
                      <div className="space-y-1.5">
                          <Label className="text-xs">Brief Description</Label>
                          <Input id="group-desc" placeholder="Scope of duties" />
                      </div>
                  </div>
                  <Button className="w-full mt-2" onClick={() => {
                      const name = (document.getElementById('group-name') as HTMLInputElement).value;
                      const desc = (document.getElementById('group-desc') as HTMLInputElement).value;
                      if (name) {
                          createGroupMutation.mutate({ name, description: desc });
                          (document.getElementById('group-name') as HTMLInputElement).value = '';
                          (document.getElementById('group-desc') as HTMLInputElement).value = '';
                      }
                  }}>
                      Create Group
                  </Button>
               </CardContent>
            </Card>
               
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group: any) => {
                    const membersInGroup = staff?.filter((s: StaffMember) => 
                        groupMembers.some((m: any) => m.group_id === group.id && m.profile_id === s.user_id)
                    ) || [];

                    return (
                        <Card 
                            key={group.id}
                            className="shadow-sm hover:border-primary/30 transition-colors cursor-pointer"
                            onClick={() => { setSelectedGroupId(group.id); setIsManagingGroup(true); }}
                        >
                            <CardContent className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="pr-12">
                                            <h4 className="font-bold text-base leading-tight">{group.name}</h4>
                                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{group.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setGroupToEdit(group);
                                                setIsEditGroupDialogOpen(true);
                                            }}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-1">
                                            {membersInGroup.slice(0, 3).map((m: StaffMember) => (
                                                <div key={m.user_id} className="h-6 w-6 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                                                    {m.photo_url || m.avatar_url ? (
                                                        <img src={m.photo_url || m.avatar_url} className="h-full w-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-[8px]">{m.first_name[0]}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground">
                                            {membersInGroup.length} Assigned
                                        </span>
                                    </div>
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
          </div>
        </TabsContent>
      </Tabs>


      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/50 border-b">
            <DialogTitle>Add Personnel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>First Name</Label>
                 <Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
               </div>
               <div className="space-y-1.5">
                 <Label>Last Name</Label>
                 <Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
               </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>System Role</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="teacher">Teacher</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kiosk PIN</Label>
                  <Input value={formData.staff_pin} onChange={e => setFormData({...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8)})} placeholder="4-8 digits" />
                </div>
            </div>
            <DialogFooter className="pt-4"><Button type="submit" className="w-full" disabled={isAddingStaff}>{isAddingStaff ? <Loader2 className="animate-spin h-4 w-4" /> : "Register Member"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/50 border-b">
            <DialogTitle>Update Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label>First Name</Label>
                 <Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} required />
               </div>
               <div className="space-y-1.5">
                 <Label>Last Name</Label>
                 <Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} required />
               </div>
            </div>
            
            <div className="space-y-1.5">
                <Label>Kiosk Security PIN</Label>
                <div className="relative">
                    <Input 
                        value={formData.staff_pin} 
                        onChange={e => setFormData({...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8)})} 
                        disabled={!canResetPin(selectedStaff!)}
                        placeholder="Enter new PIN to override" 
                        className="pl-9 font-mono" 
                    />
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Required for physical terminal access and emergency sign-outs.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Dept/Unit</Label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
            </div>

            <DialogFooter className="pt-4"><Button type="submit" className="w-full" disabled={isUpdatingStaff}>Commit Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Personnel?</AlertDialogTitle>
            <AlertDialogDescription>Permanently disable access for {selectedStaff?.first_name}. Active logs will be retained.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground">Purge Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Group Dialog */}
      <Dialog open={isManagingGroup} onOpenChange={(o) => { setIsManagingGroup(o); if(!o) setSelectedGroupId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center border border-primary/20 shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{groups.find((g: any) => g.id === selectedGroupId)?.name}</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Unit Assignments</p>
                </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Current Members</Label>
                <div className="grid gap-2">
                    {staff?.filter((s: StaffMember) => 
                        groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                    ).map((m: StaffMember) => (
                        <div key={m.user_id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                    {m.photo_url || m.avatar_url ? (
                                        <img src={m.photo_url || m.avatar_url} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                        <Users className="h-4 w-4 text-muted-foreground/30" />
                                    )}
                                </div>
                                <span className="font-bold text-sm">{m.first_name} {m.last_name}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={async () => {
                                await supabase.from('staff_group_members').delete().eq('group_id', selectedGroupId).eq('profile_id', m.user_id);
                                queryClient.invalidateQueries({ queryKey: ['staff-group-members-all'] });
                            }}>Unassign</Button>
                        </div>
                    ))}
                    {staff?.filter((s: StaffMember) => 
                        groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                    ).length === 0 && (
                        <div className="py-12 border border-dashed rounded text-center text-muted-foreground">
                             <p className="text-xs font-bold uppercase">No personnel assigned</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 border bg-primary/5 rounded space-y-4">
                <Label className="text-xs font-bold uppercase text-primary">Assign New Member</Label>
                <Select onValueChange={async (staffId) => {
                    await supabase.from('staff_group_members').upsert({ group_id: selectedGroupId!, profile_id: staffId });
                    queryClient.invalidateQueries({ queryKey: ['staff-group-members-all'] });
                    toast({ title: "Authorized", description: "Personnel added to direct report." });
                }}>
                    <SelectTrigger className="h-10">
                        <SelectValue placeholder="Identify staff..." />
                    </SelectTrigger>
                    <SelectContent>
                        {staff?.filter((s: StaffMember) => 
                            !groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                        ).map((s: StaffMember) => (
                            <SelectItem key={s.user_id} value={s.user_id}>
                                {s.first_name} {s.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setIsManagingGroup(false)}>Close Manager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
            <DialogHeader className="p-6 bg-muted/50 border-b">
                <DialogTitle>Modify Structural Unit</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input 
                        value={groupToEdit?.name || ''} 
                        onChange={e => setGroupToEdit({...groupToEdit, name: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Input 
                        value={groupToEdit?.description || ''} 
                        onChange={e => setGroupToEdit({...groupToEdit, description: e.target.value})}
                    />
                </div>
                <DialogFooter className="pt-4 gap-2">
                    <Button variant="secondary" onClick={() => setIsEditGroupDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => updateGroupMutation.mutate(groupToEdit)}>Save Updates</Button>
                </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Alert */}
      <AlertDialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dissolve Department?</AlertDialogTitle>
            <AlertDialogDescription>
                Permanent removal of "{groupToEdit?.name}". Personnel will be unassigned but remain in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deleteGroupMutation.mutate(groupToEdit?.id)} 
                className="bg-destructive text-destructive-foreground"
            >
                Dissolve Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default StaffPage;

