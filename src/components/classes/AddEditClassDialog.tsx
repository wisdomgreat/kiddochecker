
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Class } from "@/types/classes";

interface AddEditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: any) => void;
  classItem?: Class | null;
  isLoading?: boolean;
}

const AddEditClassDialog = ({ 
  isOpen, 
  onClose, 
  onSave, 
  classItem, 
  isLoading = false 
}: AddEditClassDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    age_range: '',
    capacity: '',
    room: '',
  });

  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name || '',
        description: classItem.description || '',
        age_range: classItem.age_range || '',
        capacity: classItem.capacity?.toString() || '',
        room: classItem.room || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        age_range: '',
        capacity: '',
        room: '',
      });
    }
  }, [classItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const classData = {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
    };

    if (classItem) {
      onSave({ id: classItem.id, ...classData });
    } else {
      onSave(classData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {classItem ? 'Edit Class' : 'Add New Class'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the class..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age_range">Age Range</Label>
              <Input
                id="age_range"
                value={formData.age_range}
                onChange={(e) => handleChange('age_range', e.target.value)}
                placeholder="e.g., 3-5 years"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', e.target.value)}
                min="1"
                placeholder="Max children"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              value={formData.room}
              onChange={(e) => handleChange('room', e.target.value)}
              placeholder="e.g., Room 101, Main Hall"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : classItem ? 'Update Class' : 'Add Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditClassDialog;
