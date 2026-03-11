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
import { useQueryClient } from '@tanstack/react-query';
import { useStaff, type StaffMember } from '@/hooks/useStaff';

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
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search staff members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {isEmbedded && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        )}
      </div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        initial="hidden" animate="show"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3 } } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff?.length || 0}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3 } } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Verified Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staff?.filter((s: StaffMember) => s.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3 } } }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staff?.filter((s: StaffMember) => s.is_volunteer).length || 0}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Staff List */}
      <motion.div
        className="grid gap-4"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        initial="hidden" animate="show"
      >
        {isLoading ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredStaff && filteredStaff.length > 0 ? (
          filteredStaff.map((member: StaffMember) => (
            <motion.div key={member.user_id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                        {member.avatar_url || member.photo_url ? (
                          <img 
                            src={member.avatar_url || member.photo_url} 
                            alt={`${member.first_name}`} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {member.first_name} {member.last_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                          {member.staff_pin && (
                            <span className="flex items-center gap-1 font-mono text-indigo-600 font-bold bg-indigo-50 px-2 rounded-md">
                              <Shield className="h-3 w-3" />
                              PIN: {member.staff_pin}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                        {member.role?.replace('_', ' ')}
                      </Badge>
                      {member.is_super_admin && (
                        <Badge variant="default" className="bg-amber-500">
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {member.is_volunteer && (
                        <Badge variant="outline">Volunteer</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resendWelcomeEmail(member)}
                        disabled={isResendingEmail}
                        title="Resend Welcome Email"
                      >
                        <Mail className={`h-4 w-4 ${isResendingEmail ? 'animate-pulse' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() => {
                          toast({
                            title: "Background Check Requested",
                            description: `A background check request has been sent to the partner for ${member.first_name}.`,
                          });
                        }}
                        title="Request Background Check"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(member)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first staff member
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingStaff}>
                {isAddingStaff ? 'Adding...' : 'Add Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first_name">First Name</Label>
                <Input
                  id="edit-first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-last_name">Last Name</Label>
                <Input
                  id="edit-last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-staff_pin">Staff Kiosk PIN (4-8 digits)</Label>
              <Input
                id="edit-staff_pin"
                value={formData.staff_pin}
                onChange={(e) => setFormData({ ...formData, staff_pin: e.target.value.replace(/\D/g, '').substring(0, 8) })}
                placeholder="e.g. 1234"
              />
              <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                This code is used by the staff member to authenticate on the kiosk terminals.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingStaff}>
                {isUpdatingStaff ? 'Updating...' : 'Update Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedStaff?.first_name} {selectedStaff?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
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
