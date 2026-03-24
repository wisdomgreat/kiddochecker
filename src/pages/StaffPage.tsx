import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Edit, Trash2, Loader2, Shield, UserPlus, Users, ShieldCheck, Briefcase, Building2, Plus, Info, Lock, EyeOff } from 'lucide-react';
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
import { useAuth } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

    // Authorization Check: Admin cannot reset Super Admin PIN
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
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
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

  // Helper to determine if current user can reset the PIN of the target member
  const canResetPin = (target: StaffMember) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return !(target.role === 'super_admin' || target.is_super_admin);
    return false;
  };

  const content = (
    <div className="space-y-6">
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Personnel & Teams</h1>
            <p className="text-slate-500 font-medium">Securely manage your organizational structure and staff identity.</p>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      )}

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 border-none h-14 p-1.5 rounded-2xl shadow-inner mb-8">
          <TabsTrigger value="staff" className="rounded-xl px-10 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2 h-11">
            <Users className="h-4 w-4 mr-2" />
            {t('teamRoster')}
          </TabsTrigger>
          <TabsTrigger value="groups" className="rounded-xl px-10 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all gap-2 h-11">
            <Briefcase className="h-4 w-4 mr-2" />
            {t('departmentsGroups')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search staff, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl h-11 pl-10 bg-slate-50 border-slate-200"
              />
              <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
            ) : filteredStaff && filteredStaff.length > 0 ? (
              filteredStaff.map((member: StaffMember) => (
                <Card key={member.user_id} className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden group hover:shadow-indigo-100/50 transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                          {member.avatar_url || member.photo_url ? (
                            <img src={member.avatar_url || member.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-7 w-7 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-black text-slate-900">{member.first_name} {member.last_name}</h3>
                            {member.department && (
                               <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-lg text-xs font-black uppercase tracking-widest px-3 h-6">
                                 {member.department}
                               </Badge>
                            )}
                           </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
                            {member.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>}
                            
                            {/* Staff PIN Display Logic */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-sm">
                                            <Lock className="h-3 w-3" />
                                            {member.user_id === user?.id && member.staff_pin ? member.staff_pin : '••••'}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl font-bold bg-[#020617] text-white">
                                        <p>{member.user_id === user?.id ? "Your Secure PIN" : "PIN Encrypted (Admin Reset ONLY)"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                           </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)} className="rounded-lg px-3 py-1 font-bold">
                          {member.role?.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50" onClick={() => openEditDialog(member)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600" onClick={() => openDeleteDialog(member)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No personnel found</h3>
                <p className="text-slate-500">Try adjusting your search or add a new team member.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
               <Card className="xl:col-span-1 border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 overflow-hidden group">
                 <div className="h-2 bg-indigo-600 w-full" />
                 <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Department</CardTitle>
                    <p className="text-xs font-semibold text-slate-400 leading-relaxed uppercase tracking-widest">Create a structural unit for your team.</p>
                 </CardHeader>
                 <CardContent className="space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="group-name" className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Department Name</Label>
                            <Input id="group-name" placeholder="e.g. Worship Ministry" className="rounded-[1.25rem] h-12 bg-slate-50 border-slate-100 focus:ring-indigo-500/20 font-bold" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="group-desc" className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Responsibility</Label>
                            <Input id="group-desc" placeholder="Primary objective..." className="rounded-[1.25rem] h-12 bg-slate-50 border-slate-100 focus:ring-indigo-500/20 font-medium" />
                        </div>
                    </div>
                    <Button className="w-full rounded-2xl font-black h-14 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 text-xs uppercase tracking-widest" onClick={() => {
                        const name = (document.getElementById('group-name') as HTMLInputElement).value;
                        const desc = (document.getElementById('group-desc') as HTMLInputElement).value;
                        if (name) {
                            createGroupMutation.mutate({ name, description: desc });
                            (document.getElementById('group-name') as HTMLInputElement).value = '';
                            (document.getElementById('group-desc') as HTMLInputElement).value = '';
                        }
                    }}>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Unit
                    </Button>
                 </CardContent>
               </Card>
               
               <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
                    {groups.map((group: any) => {
                        const membersInGroup = staff?.filter((s: StaffMember) => 
                            groupMembers.some((m: any) => m.group_id === group.id && m.profile_id === s.user_id)
                        ) || [];

                        return (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={group.id}
                            >
                                <Card 
                                    className="border-none shadow-xl shadow-slate-100/60 dark:shadow-none rounded-[2.25rem] p-6 bg-white dark:bg-slate-900 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setGroupToEdit(group);
                                                setIsEditGroupDialogOpen(true);
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setGroupToEdit(group);
                                                setIsDeleteGroupDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div onClick={() => { setSelectedGroupId(group.id); setIsManagingGroup(true); }} className="flex-1">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="pt-1">
                                                <h4 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">{group.name}</h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 line-clamp-2">{group.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2.5">
                                                    {membersInGroup.slice(0, 4).map((m: StaffMember) => (
                                                        <div key={m.user_id} className="h-9 w-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black overflow-hidden shadow-sm">
                                                            {m.photo_url || m.avatar_url ? (
                                                                <img src={m.photo_url || m.avatar_url} className="h-full w-full object-cover" alt="" />
                                                            ) : (
                                                                <span className="text-slate-400">{m.first_name[0]}{m.last_name[0]}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {membersInGroup.length > 4 && (
                                                        <div className="h-9 w-9 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[11px] font-black text-white shadow-md">
                                                            +{membersInGroup.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                                    {membersInGroup.length === 0 ? 'Vacant' : `${membersInGroup.length} Staffed`}
                                                </span>
                                            </div>
                                            <Plus className="h-5 w-5 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                    {groups.length === 0 && (
                        <div className="md:col-span-2 py-32 text-center bg-slate-50/50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center scale-up-center">
                             <div className="h-20 w-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                                <Briefcase className="h-10 w-10 text-slate-200" />
                             </div>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Initialize Structure</h3>
                             <p className="max-w-xs text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">Add departments to organize your team and manage specific rosters.</p>
                        </div>
                    )}
               </div>
            </div>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black">Add Team Member</DialogTitle></DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="First Name" required className="h-12 rounded-xl" />
               <Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Last Name" required className="h-12 rounded-xl" />
            </div>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" required className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="teacher">Teacher</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
                <Input value={formData.staff_pin} onChange={e => setFormData({...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8)})} placeholder="Kiosk PIN (4 digits)" className="h-12 rounded-xl" />
            </div>
            <DialogFooter className="pt-4"><Button type="submit" className="w-full bg-indigo-600 rounded-xl h-12 font-bold" disabled={isAddingStaff}>{isAddingStaff ? <Loader2 className="animate-spin h-5 w-5" /> : "Initiate Onboarding"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - ENHANCED FOR PIN RESET */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg">
          <DialogHeader className="mb-6"><DialogTitle className="text-2xl font-black">Update Member</DialogTitle></DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <Input value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="First Name" required className="h-12 rounded-xl" />
               <Input value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Last Name" required className="h-12 rounded-xl" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kiosk Security PIN</Label>
                    <div className="relative group">
                        <Input 
                            value={formData.staff_pin} 
                            onChange={e => setFormData({...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8)})} 
                            disabled={!canResetPin(selectedStaff!)}
                            placeholder={selectedStaff?.user_id === user?.id ? "Your current PIN" : "Enter new PIN to reset"} 
                            className="h-12 rounded-xl pl-10 tracking-[0.3em] font-mono font-bold disabled:bg-slate-50 disabled:text-slate-300" 
                        />
                        <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        {!canResetPin(selectedStaff!) && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute right-3.5 top-3.5 text-rose-400"><EyeOff className="h-5 w-5" /></div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-rose-600 text-white rounded-xl font-bold">
                                        You do not have permission to reset this user's PIN.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 ml-1">
                        {selectedStaff?.user_id === user?.id ? "Change your own PIN used for Kiosk tools." : "Admins can overwrite other members' PINs if forgotten."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Department" className="h-12 rounded-xl" />
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="h-12 rounded-xl" />
            </div>

            <DialogFooter className="pt-4"><Button type="submit" className="w-full bg-indigo-600 rounded-xl h-12 font-bold" disabled={isUpdatingStaff}>Save Changes</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selectedStaff?.first_name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently disable their access and clear associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-rose-600 rounded-xl">Remove Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isManagingGroup} onOpenChange={(o) => { setIsManagingGroup(o); if(!o) setSelectedGroupId(null); }}>
        <DialogContent className="rounded-[3rem] p-0 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border-none shadow-2xl">
          <div className="p-8 bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-4">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10" onClick={() => setIsManagingGroup(false)}>
                    <EyeOff className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-indigo-500/20 rounded-[2rem] flex items-center justify-center border border-indigo-500/30">
                    <Building2 className="h-10 w-10 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tight">{groups.find((g: any) => g.id === selectedGroupId)?.name}</h2>
                    <p className="text-indigo-300 font-bold text-xs uppercase tracking-[0.2em] mt-2">Departmental Roster</p>
                </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 dark:bg-slate-950 bg-white">
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Assignments</Label>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase">
                        {staff?.filter((s: StaffMember) => groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)).length} Members
                    </Badge>
                </div>
                <div className="grid gap-3">
                    {staff?.filter((s: StaffMember) => 
                        groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                    ).map((m: StaffMember) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={m.user_id} 
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-transparent hover:border-slate-100 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                                    {m.photo_url || m.avatar_url ? (
                                        <img src={m.photo_url || m.avatar_url} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                        <Users className="h-5 w-5 text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <span className="font-extrabold text-slate-900 dark:text-white">{m.first_name} {m.last_name}</span>
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{m.role}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-600 font-black text-[10px] uppercase rounded-xl h-9 px-4 transition-all opacity-0 group-hover:opacity-100" onClick={async () => {
                                await supabase.from('staff_group_members').delete().eq('group_id', selectedGroupId).eq('profile_id', m.user_id);
                                queryClient.invalidateQueries({ queryKey: ['staff-group-members-all'] });
                            }}>Unassign</Button>
                        </motion.div>
                    ))}
                    {staff?.filter((s: StaffMember) => 
                        groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                    ).length === 0 && (
                        <div className="py-12 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-2">
                             <Users className="h-10 w-10 text-slate-200" />
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No members assigned yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3 ml-2">
                    <UserPlus className="h-4 w-4 text-indigo-600" />
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Add Available Staff</Label>
                </div>
                <Select onValueChange={async (staffId) => {
                    await supabase.from('staff_group_members').upsert({ group_id: selectedGroupId!, profile_id: staffId });
                    queryClient.invalidateQueries({ queryKey: ['staff-group-members-all'] });
                    toast({ title: "Updated", description: "Personnel added to department." });
                }}>
                    <SelectTrigger className="h-14 rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 font-bold px-6">
                        <SelectValue placeholder="Select staff member..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950 p-2">
                        {staff?.filter((s: StaffMember) => 
                            !groupMembers.some((m: any) => m.group_id === selectedGroupId && m.profile_id === s.user_id)
                        ).map((s: StaffMember) => (
                            <SelectItem key={s.user_id} value={s.user_id} className="font-bold rounded-xl h-12 focus:bg-indigo-50 focus:text-indigo-600">
                                {s.first_name} {s.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-md">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight">Modify Department</DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Update naming and primary responsibilities.</p>
            </DialogHeader>
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Title</Label>
                    <Input 
                        value={groupToEdit?.name || ''} 
                        onChange={e => setGroupToEdit({...groupToEdit, name: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Function</Label>
                    <Input 
                        value={groupToEdit?.description || ''} 
                        onChange={e => setGroupToEdit({...groupToEdit, description: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium"
                    />
                </div>
                <DialogFooter className="pt-4">
                    <Button 
                        className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-xs uppercase tracking-widest"
                        onClick={() => updateGroupMutation.mutate(groupToEdit)}
                    >
                        Save Corrections
                    </Button>
                </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Alert */}
      <AlertDialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 text-rose-100 -mr-4 -mt-4 opacity-50 rotate-12">
            <Shield className="h-24 w-24 fill-current" />
          </div>
          <AlertDialogHeader className="relative z-10">
            <div className="h-16 w-16 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Dissolve Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                This will permanently remove the <span className="text-rose-600">"{groupToEdit?.name}"</span> unit. Staff members will remain in the system but their assignments to this group will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-8">
            <AlertDialogCancel className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-100">Abort</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deleteGroupMutation.mutate(groupToEdit.id)} 
                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100"
            >
                Confirm Dissolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default StaffPage;
