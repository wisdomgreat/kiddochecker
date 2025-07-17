import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useClasses } from '@/hooks/useClasses';
import { GraduationCap, Plus, Edit, Trash2, Users, MapPin, Clock } from 'lucide-react';

const ClassesManagement = () => {
  const { toast } = useToast();
  const { classes, isLoading, addClass, updateClass, deleteClass } = useClasses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    age_range: '',
    capacity: '',
    room: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await updateClass(editingClass.id, {
          ...formData,
          capacity: parseInt(formData.capacity) || null
        });
        toast({
          title: "Class Updated",
          description: "Class has been updated successfully.",
        });
      } else {
        await addClass(formData);
        toast({
          title: "Class Created",
          description: "New class has been created successfully.",
        });
      }
      setIsDialogOpen(false);
      setEditingClass(null);
      setFormData({ name: '', description: '', age_range: '', capacity: '', room: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      age_range: classItem.age_range || '',
      capacity: classItem.capacity?.toString() || '',
      room: classItem.room || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(classId);
        toast({
          title: "Class Deleted",
          description: "Class has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete class. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's classes and age groups.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingClass(null);
                setFormData({ name: '', description: '', age_range: '', capacity: '', room: '' });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
              </DialogHeader>
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
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="age_range">Age Range</Label>
                  <Input
                    id="age_range"
                    placeholder="e.g., 3-5 years"
                    value={formData.age_range}
                    onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    placeholder="e.g., Room 101"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingClass ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    {classItem.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {classItem.description && (
                  <p className="text-sm text-muted-foreground">{classItem.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {classItem.age_range && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {classItem.age_range}
                    </Badge>
                  )}
                  {classItem.capacity && (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {classItem.capacity} max
                    </Badge>
                  )}
                  {classItem.room && (
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {classItem.room}
                    </Badge>
                  )}
                </div>
                
                <div className="pt-2 text-xs text-muted-foreground">
                  Created: {new Date(classItem.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first class to get started with organizing children.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Class
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
};

export default ClassesManagement;