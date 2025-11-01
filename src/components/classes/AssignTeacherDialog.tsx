import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AssignTeacherDialogProps {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignTeacherDialog = ({ classId, className, open, onOpenChange, onSuccess }: AssignTeacherDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Fetch all teachers/staff
  const { data: availableTeachers = [] } = useQuery({
    queryKey: ['available-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles!inner(id, first_name, last_name)
        `)
        .in('role', ['teacher', 'teacher_assistant', 'staff']);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch current teacher assignment
  const { data: currentAssignment } = useQuery({
    queryKey: ['teacher-assignment', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('user_id')
        .eq('class_id', classId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (currentAssignment) {
      setSelectedTeacher(currentAssignment.user_id);
    }
  }, [currentAssignment]);

  const handleAssign = async () => {
    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Remove existing assignment
      await supabase
        .from('teachers')
        .delete()
        .eq('class_id', classId);

      // Add new assignment
      const { error } = await supabase
        .from('teachers')
        .insert({
          user_id: selectedTeacher,
          class_id: classId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher assigned successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign teacher",
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
          <DialogTitle>Assign Teacher to {className}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a teacher..." />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map((teacher: any) => (
                  <SelectItem key={teacher.user_id} value={teacher.user_id}>
                    {teacher.profiles.first_name} {teacher.profiles.last_name} ({teacher.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Teacher
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
