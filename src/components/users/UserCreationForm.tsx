import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCcw, UserPlus } from 'lucide-react';
import { assignUserRole } from '@/utils/roleUtils';

interface UserCreationFormProps {
  onUserCreated: () => void;
}

export const UserCreationForm = ({ onUserCreated }: UserCreationFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'parent' as const,
    phone: ''
  });
  const { toast } = useToast();

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      console.log("Creating user:", newUserForm);
      
      // Create user with admin.createUser (this will trigger the handle_new_user function)
      // Since we're not setting is_org_creator=true, it will get the default parent role
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserForm.email,
        password: 'TempPass123!',
        email_confirm: true,
        user_metadata: {
          first_name: newUserForm.firstName,
          last_name: newUserForm.lastName,
          phone: newUserForm.phone
          // Note: not setting is_org_creator, so default parent role will be assigned
        }
      });

      if (authError) {
        console.error("Error creating user:", authError);
        throw authError;
      }

      if (authData.user) {
        // Profile creation is handled by the database trigger
        
        // If the selected role is different from 'parent', update it
        if (newUserForm.role !== 'parent') {
          console.log(`Updating user role from 'parent' to '${newUserForm.role}'`);
          const roleResult = await assignUserRole(authData.user.id, newUserForm.role);
          
          if (!roleResult.success) {
            console.error("Error updating user role:", roleResult.error);
            toast({
              title: "Warning",
              description: "User created but role assignment failed. Please update the role manually.",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Success",
        description: "User created successfully! They will receive an email to set their password.",
      });

      setNewUserForm({ email: '', firstName: '', lastName: '', role: 'parent', phone: '' });
      onUserCreated();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">First Name</label>
          <Input
            placeholder="Enter first name"
            value={newUserForm.firstName}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Last Name</label>
          <Input
            placeholder="Enter last name"
            value={newUserForm.lastName}
            onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          placeholder="Enter email address"
          value={newUserForm.email}
          onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Phone (Optional)</label>
        <Input
          type="tel"
          placeholder="Enter phone number"
          value={newUserForm.phone}
          onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Role</label>
        <Select value={newUserForm.role} onValueChange={(value: any) => setNewUserForm(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
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
      <Button 
        onClick={handleCreateUser}
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? (
          <>
            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </>
        )}
      </Button>
    </div>
  );
};

export default UserCreationForm;
