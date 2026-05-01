import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { supabase } from '@/integrations/supabase/client';
import { assignUserRole } from '@/utils/roleUtils';
import { Loader2, Key, ShieldCheck, RefreshCw } from 'lucide-react';
import { AppRole } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: AppRole;
    is_super_admin: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditUserDialog = ({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'parent' as AppRole,
    address: '',
    city: '',
    state: '',
    zip: '',
    gender: '',
    occupation: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const { user: currentUser } = useAuth();
  const { sendStaffPinNotification } = useEmailNotifications();
  const [staffPin, setStaffPin] = useState<string | null>(null);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role,
        address: (user as any).address || '',
        city: (user as any).city || '',
        state: (user as any).state || '',
        zip: (user as any).zip || '',
        gender: (user as any).gender || '',
        occupation: (user as any).occupation || '',
        emergency_contact_name: (user as any).emergency_contact_name || '',
        emergency_contact_phone: (user as any).emergency_contact_phone || '',
      });
      loadStaffPin(user.id);
    }
    checkCurrentUserRole();
  }, [user]);

  const checkCurrentUserRole = async () => {
    if (!currentUser) return;
    const { data } = await supabase.from('user_roles').select('*').eq('user_id', currentUser.id).single();
    setCurrentUserRole(data);
  };

  const loadStaffPin = async (id: string) => {
    const { data } = await (supabase.from('profiles').select('staff_pin' as any).eq('id', id).single() as any);
    setStaffPin(data?.staff_pin || null);
  };

  const handleGeneratePin = async () => {
    if (!user) return;
    setIsGeneratingPin(true);
    try {
      const { data, error } = await supabase.rpc('generate_staff_pin_rpc', { p_user_id: user.id });
      if (error) throw error;
      setStaffPin(data as string);
      
      // Auto-Distribute securely via email
      if (user.email) {
        sendStaffPinNotification(user.email, `${user.first_name} ${user.last_name}`, data as string);
        toast({ title: "PIN Distributed", description: `PIN has been sent to ${user.email}` });
      } else {
        toast({ title: "PIN Generated", description: `Staff PIN: ${data}. (No email found to notify)` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingPin(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Reset Link Sent",
        description: `A password reset email has been sent to ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger password reset",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
           zip_code: formData.zip,
          gender: formData.gender,
          occupation: formData.occupation,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (formData.role !== user.role) {
        const roleResult = await assignUserRole(user.id, formData.role);
        if (!roleResult.success) {
          throw new Error('Failed to update user role');
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
          <div>
            <Label htmlFor="email">Email (read-only)</Label>
            <Input id="email" value={user?.email || ''} disabled />
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
            <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="regular_user">Regular User (Youth)</SelectItem>
                <SelectItem value="volunteer">Volunteer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="ec_name">Emergency Contact</Label>
              <Input
                id="ec_name"
                placeholder="Name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ec_phone">EC Phone</Label>
              <Input
                id="ec_phone"
                placeholder="Phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          {(currentUserRole?.role === 'super_admin' || currentUserRole?.is_super_admin) && 
           ['staff', 'teacher', 'teacher_assistant', 'admin', 'volunteer'].includes(formData.role) && (
            <div className="pt-4 border-t border-gray-100">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <ShieldCheck className="w-3 h-3" /> Staff Identity Auth
              </Label>
              <div className="bg-gray-50 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Staff Identity PIN</span>
                  </div>
                  {staffPin ? (
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-sm font-mono tracking-wider">
                      {staffPin}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400 font-normal">Not Set</Badge>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-4">
                  This PIN is used for secure Kiosk staff authorization. It is a unique alphanumeric identity code.
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGeneratePin}
                  disabled={isGeneratingPin}
                  className="w-full bg-card hover:bg-gray-50 text-indigo-600 border-indigo-100 hover:border-indigo-200"
                >
                  {isGeneratingPin ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
                  {staffPin ? 'Reset Identity PIN' : 'Generate Identity PIN'}
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
             <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                Security Administration
             </Label>
             <Button 
                type="button"
                variant="destructive" 
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                onClick={handlePasswordReset}
                disabled={currentUserRole?.role === 'admin' && user?.is_super_admin}
             >
                <Key className="w-4 h-4" /> Reset Account Password
             </Button>
             {currentUserRole?.role === 'admin' && user?.is_super_admin && (
                <p className="text-[10px] text-red-400 mt-2 italic text-center">
                   Account Protection: Standard admins cannot reset Super Admin passwords.
                </p>
             )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

