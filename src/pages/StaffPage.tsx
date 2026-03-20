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
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6">
          <TabsTrigger value="staff" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            {t('teamRoster')}
          </TabsTrigger>
          <TabsTrigger value="groups" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
                               <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-lg text-[10px] font-bold uppercase tracking-wider">{member.department}</Badge>
                            )}
                           </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
                            {member.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>}
                            
                            {/* Staff PIN Display Logic */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black tracking-[0.2em]">
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

        <TabsContent value="groups" className="space-y-6">
            {/* Same Groups UI... I will keep this part clean */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem]">
                 <CardHeader><CardTitle className="text-xl font-black">New Department</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    <Input id="group-name" placeholder="Department Name" className="rounded-xl h-11" />
                    <Input id="group-desc" placeholder="Responsibility..." className="rounded-xl h-11" />
                    <Button className="w-full rounded-xl font-bold h-11 bg-indigo-600" onClick={() => {
                        const name = (document.getElementById('group-name') as HTMLInputElement).value;
                        const desc = (document.getElementById('group-desc') as HTMLInputElement).value;
                        if (name) createGroupMutation.mutate({ name, description: desc });
                    }}><Plus className="h-4 w-4 mr-2" />Create</Button>
                 </CardContent>
               </Card>
               <div className="md:col-span-2 space-y-4">
                    {groups.map((group: any) => (
                        <Card key={group.id} className="border-none shadow-xl shadow-slate-100 rounded-[2rem] p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center"><Building2 className="h-5 w-5 text-indigo-600" /></div>
                                <div><h4 className="font-bold">{group.name}</h4><p className="text-xs text-slate-400">{group.description}</p></div>
                            </div>
                        </Card>
                    ))}
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
    </div>
  );

  return <UnifiedDashboardLayout>{content}</UnifiedDashboardLayout>;
};

export default StaffPage;
