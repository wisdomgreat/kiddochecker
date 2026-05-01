
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast';

interface AddClassFormProps {
  onSuccess?: () => void;
}

const AddClassForm = ({ onSuccess }: AddClassFormProps) => {
  const { addClass, isAddingClass } = useClasses();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    age_range: '',
    capacity: '',
    room: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      addClass({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      });
      
      setFormData({
        name: '',
        description: '',
        age_range: '',
        capacity: '',
        room: '',
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Class Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="age_range">Age Range</Label>
        <Input
          id="age_range"
          value={formData.age_range}
          onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
          placeholder="e.g., 3-5 years"
        />
      </div>
      
      <div>
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          placeholder="Maximum number of children"
        />
      </div>
      
      <div>
        <Label htmlFor="room">Room</Label>
        <Input
          id="room"
          value={formData.room}
          onChange={(e) => setFormData({ ...formData, room: e.target.value })}
          placeholder="Room number or location"
        />
      </div>
      
      <Button type="submit" disabled={isAddingClass} className="w-full">
        {isAddingClass ? 'Creating...' : 'Create Class'}
      </Button>
    </form>
  );
};

export default AddClassForm;

