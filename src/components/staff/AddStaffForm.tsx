
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, X } from 'lucide-react';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useToast } from '@/hooks/use-toast';

interface AddStaffFormProps {
  onClose: () => void;
}

const AddStaffForm = ({ onClose }: AddStaffFormProps) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      await addStaff({
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        is_volunteer: formData.is_volunteer
      });
      
      // Reset form and close
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        is_volunteer: false
      });
      
      onClose();
      
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
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Staff Member
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
                required
                disabled={isAddingStaff}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Last Name *
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                required
                disabled={isAddingStaff}
              />
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
              required
              disabled={isAddingStaff}
            />
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
              Role *
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
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="staff">Staff Member</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_volunteer"
              checked={formData.is_volunteer}
              onCheckedChange={(checked) => handleInputChange('is_volunteer', checked as boolean)}
              disabled={isAddingStaff}
            />
            <label htmlFor="is_volunteer" className="text-sm font-medium">
              This person is a volunteer
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isAddingStaff}
              className="flex-1"
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isAddingStaff}
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The new staff member will receive an email with temporary login credentials. 
            They should change their password upon first login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddStaffForm;
