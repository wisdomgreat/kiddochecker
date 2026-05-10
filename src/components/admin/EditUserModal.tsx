import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";
import { useQuery } from "@tanstack/react-query";
import { Shield, UserCog, Loader2 } from "lucide-react";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

const EditUserModal = ({ open, onOpenChange, user, onSuccess }: EditUserModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'parent' as AppRole,
    customRoleId: null as string | null,
    isVolunteer: false,
    isActive: true
  });

  // Fetch custom roles
  const { data: customRoles = [] } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_roles").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'parent',
        customRoleId: user.custom_role_id || null,
        isVolunteer: user.is_volunteer || false,
        isActive: user.is_active || true
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: formData.role,
          custom_role_id: formData.customRoleId,
          is_volunteer: formData.isVolunteer
        })
        .eq('user_id', user.id);

      if (roleError) throw roleError;

      toast({
        title: 'User Updated',
        description: `Successfully updated ${formData.firstName}'s profile and role.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">Edit User Profile</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Manage permissions and contact info.</DialogDescription>
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
            <Label className="font-bold text-slate-700">Contact Email</Label>
            <Input value={user.email} disabled className="rounded-2xl h-12 bg-slate-100 border-none text-slate-500 font-medium" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="font-bold text-slate-700">System Role</Label>
              <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({...formData, role: value})}>
                <SelectTrigger className="rounded-2xl h-12 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="staff">Staff (Standard)</SelectItem>
                  <SelectItem value="teacher">Teacher (Class Access)</SelectItem>
                  <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {user.is_super_admin && <SelectItem value="super_admin">Super Admin</SelectItem>}
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
                  <SelectItem value="none">Default Permissions</SelectItem>
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
                <Label htmlFor="isVolunteer" className="font-bold text-foreground">Volunteer Status</Label>
                <p className="text-xs text-slate-500">Enable specialized volunteer check-in rules</p>
              </div>
              <Switch
                id="isVolunteer"
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
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;

