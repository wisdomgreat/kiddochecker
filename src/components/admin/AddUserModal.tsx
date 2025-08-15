
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

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
    isVolunteer: false,
    sendInvitation: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      console.log('Creating user:', formData);

      // Create user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: crypto.randomUUID(),
          role: formData.role,
          is_volunteer: formData.isVolunteer
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw new Error('Failed to assign user role');
      }

      toast({
        title: 'User Created Successfully',
        description: `${formData.firstName} ${formData.lastName} has been created`,
      });

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'parent' as AppRole,
        isVolunteer: false,
        sendInvitation: true
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error Creating User',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-left">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div className="text-left">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="text-left">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="text-left">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="text-left">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 text-left">
            <Switch
              id="isVolunteer"
              checked={formData.isVolunteer}
              onCheckedChange={(checked) => setFormData({...formData, isVolunteer: checked})}
            />
            <Label htmlFor="isVolunteer">Volunteer</Label>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
