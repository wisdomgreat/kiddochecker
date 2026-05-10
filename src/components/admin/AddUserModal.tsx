import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";
import { Loader2, UserPlus, Shield, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddUserModal = ({ open, onOpenChange, onSuccess }: AddUserModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'parent' as AppRole,
    customRoleId: null as string | null,
    isVolunteer: false,
    sendInvitation: true
  });

  // Fetch custom roles for selection
  const { data: customRoles = [] } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Create profile
      await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone
      });

      // Assign role (including custom_role_id)
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: formData.role,
        custom_role_id: formData.customRoleId,
        is_volunteer: formData.isVolunteer,
        is_super_admin: formData.role === 'super_admin'
      });

      if (roleError) throw roleError;

      toast({
        title: 'User Created',
        description: `${formData.firstName} has been added to the system.`,
      });

      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'parent' as AppRole,
        customRoleId: null,
        isVolunteer: false,
        sendInvitation: true
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-card/20 flex items-center justify-center">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">Register New User</DialogTitle>
            <DialogDescription className="text-indigo-100 font-medium opacity-80">Add a new staff member or parent.</DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-bold text-slate-700">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-card"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-bold text-slate-700">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-card"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-slate-700">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:bg-card"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="font-bold text-slate-700">Initial System Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: AppRole) => setFormData({...formData, role: value})}
              >
                <SelectTrigger className="rounded-2xl h-12 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="regular_user">Regular User (Youth)</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customRole" className="font-bold text-slate-700">Custom Role Profile</Label>
              <Select 
                value={formData.customRoleId || "none"} 
                onValueChange={(value) => setFormData({...formData, customRoleId: value === "none" ? null : value})}
              >
                <SelectTrigger className="rounded-2xl h-12 border-slate-200 bg-indigo-50/30">
                  <SelectValue placeholder="No custom profile" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="none">No Custom Profile</SelectItem>
                  {customRoles.map((role: any) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="addVolunteer" className="font-bold text-foreground">Mark as Volunteer</Label>
                <p className="text-xs text-slate-500">Enable volunteer tracking rules</p>
              </div>
              <Switch
                id="addVolunteer"
                checked={formData.isVolunteer}
                onCheckedChange={(checked) => setFormData({...formData, isVolunteer: checked})}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl font-bold h-12 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 shadow-lg shadow-indigo-100">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;

