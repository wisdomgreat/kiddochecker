import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Edit, Trash2, Loader2, Shield, UserPlus, Users, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useStaff, type StaffMember } from '@/hooks/useStaff';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Building2, Plus, Info } from 'lucide-react';

const StaffPage = ({ isEmbedded = false }: { isEmbedded?: boolean }) => {
  const { staff, isLoading, addStaff, isAddingStaff, updateStaff, isUpdatingStaff, resendWelcomeEmail, isResendingEmail } = useStaff();
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
        .select('group_id, profile_id, profiles:profile_id(first_name, last_name)');
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
      department: formData.department,
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    updateStaff({
      userId: selectedStaff.user_id,
      updates: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        is_volunteer: formData.is_volunteer,
        staff_pin: formData.staff_pin,
        department: formData.department,
      }
    });
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedStaff.user_id);

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedStaff.user_id);

      if (profileError) console.error('Profile delete error:', profileError);

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

  const content = (
    <div className="space-y-6">
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Personnel & Teams</h1>
            <p className="text-slate-500 font-medium">Manage your organizational structure and staff units.</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      )}

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6">
          <TabsTrigger value="staff" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            Team Roster
          </TabsTrigger>
          <TabsTrigger value="groups" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Briefcase className="h-4 w-4 mr-2" />
            Departments & Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search by name, email or role..."
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
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] h-fit">
                <CardHeader>
                  <CardTitle className="text-xl font-black">New Group</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Group Name</Label>
                    <Input id="group-name" placeholder="e.g., Technical Support" className="rounded-xl h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Description</Label>
                    <Input id="group-desc" placeholder="Responsibility overview..." className="rounded-xl h-11" />
                  </div>
                  <Button 
                    className="w-full rounded-xl font-bold h-11 bg-indigo-600 hover:bg-indigo-700 mt-2"
                    onClick={() => {
                      const name = (document.getElementById('group-name') as HTMLInputElement).value;
                      const desc = (document.getElementById('group-desc') as HTMLInputElement).value;
                      if (name) createGroupMutation.mutate({ name, description: desc });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </CardContent>
              </Card>

              <div className="md:col-span-2 grid grid-cols-1 gap-4">
                {groups.length === 0 ? (
                  <div className="py-12 bg-white rounded-3xl border border-dashed text-center text-slate-400 font-bold">
                    No departments defined yet.
                  </div>
                ) : (
                  groups.map((group: any) => (
                    <Card key={group.id} className="border-none shadow-xl shadow-slate-100 rounded-[2rem] group hover:bg-slate-50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{group.name}</h4>
                              <p className="text-xs text-slate-400 font-medium mb-3">{group.description || 'General staff department'}</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {groupMembers.filter((m: any) => m.group_id === group.id).map((m: any) => (
                                  <Badge key={m.profile_id} className="bg-white border-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                    {m.profiles?.first_name} {m.profiles?.last_name}
                                  </Badge>
                                ))}
                                {groupMembers.filter((m: any) => m.group_id === group.id).length === 0 && (
                                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">No members assigned yet</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-indigo-600 text-white font-black px-3 rounded-xl shadow-lg shadow-indigo-100">
                             {groupMembers.filter((m: any) => m.group_id === group.id).length} MEMBERS
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs updated with Department */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-3xl bg-white/95 backdrop-blur-xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black">Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">First Name</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required className="rounded-xl h-12" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">Last Name</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required className="rounded-xl h-12" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold ml-1">Email Address</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="rounded-xl h-12" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">Base Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-none">
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">Department/Group</Label>
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g. Technical" className="rounded-xl h-12" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-6">
              <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isAddingStaff} className="rounded-xl font-black px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100">
                {isAddingStaff ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-3xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black">Update Identity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">First Name</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required className="rounded-xl h-12" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold ml-1">Last Name</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required className="rounded-xl h-12" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <Label className="font-bold ml-1">Department</Label>
                 <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="rounded-xl h-12 text-indigo-600 font-bold" />
               </div>
               <div className="space-y-1.5">
                 <Label className="font-bold ml-1">Phone</Label>
                 <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl h-12" />
               </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold ml-1 font-black uppercase text-[10px] tracking-widest text-slate-400">Security PIN</Label>
              <Input value={formData.staff_pin} onChange={(e) => setFormData({ ...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8) })} placeholder="4-8 digits" className="rounded-xl h-12 font-mono text-lg tracking-[0.5em]" />
            </div>

            <div className="space-y-3 pt-2">
              <Label className="font-bold ml-1 font-black uppercase text-[10px] tracking-widest text-indigo-500">Functional Group Memberships</Label>
              <div className="grid grid-cols-2 gap-3">
                {groups.map((group: any) => (
                  <div key={group.id} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <input 
                      type="checkbox" 
                      id={`group-${group.id}`}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      checked={groupMembers.some((m: any) => m.profile_id === selectedStaff?.user_id && m.group_id === group.id)}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          await supabase.from('staff_group_members').insert({ 
                            group_id: group.id, 
                            profile_id: selectedStaff?.user_id 
                          });
                        } else {
                          await supabase.from('staff_group_members').delete().match({ 
                            group_id: group.id, 
                            profile_id: selectedStaff?.user_id 
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ['staff-group-members-all'] });
                      }}
                    />
                    <label htmlFor={`group-${group.id}`} className="text-xs font-bold text-slate-600 truncate">{group.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={isUpdatingStaff} className="rounded-xl font-black px-12 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isUpdatingStaff ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Deactivate Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              You are about to remove <strong>{selectedStaff?.first_name} {selectedStaff?.last_name}</strong> from the active roster. 
              This will disable their kiosk access and clear their upcoming shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl font-bold">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs px-8">Confirm Removal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <UnifiedDashboardLayout>
      {content}
    </UnifiedDashboardLayout>
  );
};

export default StaffPage;
