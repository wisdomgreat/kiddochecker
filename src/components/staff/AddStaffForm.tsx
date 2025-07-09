
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useToast } from '@/hooks/use-toast';

interface AddStaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddStaffForm = ({ open, onOpenChange, onSuccess }: AddStaffFormProps) => {
  const { addStaff, isAddingStaff } = useStaffManagement();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    is_volunteer: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('Submitting staff data:', formData);
      
      await addStaff({
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        is_volunteer: formData.is_volunteer
      });
      
      // Reset form and close dialog
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        is_volunteer: false
      });
      setErrors({});
      
      onOpenChange(false);
      onSuccess();
      
      toast({
        title: "Success",
        description: "Staff member has been added successfully. They will receive login credentials via email.",
      });
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Staff Member
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                First Name *
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                className={errors.first_name ? 'border-red-300' : ''}
                disabled={isAddingStaff}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.first_name}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-red-300' : ''}
                disabled={isAddingStaff}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.last_name}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Email Address *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-red-300' : ''}
              disabled={isAddingStaff}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Phone Number
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number (optional)"
              disabled={isAddingStaff}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Role
            </label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isAddingStaff}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="volunteer"
              checked={formData.is_volunteer}
              onCheckedChange={(checked) => handleInputChange('is_volunteer', checked as boolean)}
              disabled={isAddingStaff}
            />
            <label htmlFor="volunteer" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              This person is a volunteer
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isAddingStaff}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isAddingStaff}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingStaff ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Adding Staff...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="bg-blue-50 p-3 rounded-lg mt-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The new staff member will receive an email with temporary login credentials.
            They should change their password upon first login.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffForm;
