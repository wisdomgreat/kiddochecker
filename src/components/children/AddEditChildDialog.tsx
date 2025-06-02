
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Child } from "@/hooks/useChildren";
import { useAuth } from "@/context/AuthContext";

interface AddEditChildDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (childData: any) => void;
  child?: Child | null;
  isLoading?: boolean;
}

const AddEditChildDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  child, 
  isLoading = false 
}: AddEditChildDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    allergies: '',
    medical_info: '',
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    if (child) {
      setFormData({
        first_name: child.first_name || '',
        last_name: child.last_name || '',
        age: child.age?.toString() || '',
        allergies: child.allergies || '',
        medical_info: child.medical_info || '',
        notes: child.notes || '',
        emergency_contact_name: child.emergency_contact_name || '',
        emergency_contact_phone: child.emergency_contact_phone || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        age: '',
        allergies: '',
        medical_info: '',
        notes: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
      });
    }
  }, [child, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const childData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null,
      parent_id: user?.id,
    };

    if (child) {
      onSave({ id: child.id, ...childData });
    } else {
      onSave(childData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {child ? 'Edit Child' : 'Add New Child'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              min="0"
              max="18"
            />
          </div>
          
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="List any allergies or dietary restrictions..."
            />
          </div>
          
          <div>
            <Label htmlFor="medical_info">Medical Information</Label>
            <Textarea
              id="medical_info"
              value={formData.medical_info}
              onChange={(e) => handleChange('medical_info', e.target.value)}
              placeholder="Any medical conditions or medications..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                type="tel"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : child ? 'Update Child' : 'Add Child'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditChildDialog;
