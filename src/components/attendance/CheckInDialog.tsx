import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

import { useAuth } from '@/context/AuthContext';
import { AttendanceService } from '@/services/attendanceService';

export const CheckInDialog = ({ open, onOpenChange, onSuccess }: CheckInDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch all children
  const { data: children = [] } = useQuery({
    queryKey: ['all-children'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch all classes
  const { data: classes = [] } = useQuery({
    queryKey: ['all-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const { sendCheckInNotification } = useEmailNotifications();

  const handleCheckIn = async () => {
    if (!selectedChild) {
      toast({
        title: "Error",
        description: "Please select a child",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch child and parent data for notification
      const { data: childData } = await supabase
        .from('children')
        .select('*, parent_id')
        .eq('id', selectedChild)
        .single();

      const result = await AttendanceService.checkInChild({
        childId: selectedChild,
        classId: selectedClass || undefined,
        checkedInBy: user?.id,
        method: 'staff_dashboard',
        station: 'Manual Dashboard'
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to check in child");
      }

      // Notify parent
      if (childData?.parent_id) {
        try {
          let email = '';
          const { data: profile } = await (supabase
            .from('profiles')
            .select('email' as any)
            .eq('id', childData.parent_id)
            .single() as any);
          
          email = profile?.email;
          if (!email) {
            const { data: q } = await (supabase
              .from('auth_users_emails_view' as any)
              .select('email' as any)
              .eq('id', childData.parent_id)
              .single() as any);
            email = q?.email || '';
          }

          if (email) {
            const className = classes.find((c: any) => c.id === selectedClass)?.name || 'Class';
            sendCheckInNotification(email, `${childData.first_name} ${childData.last_name}`, className);
          }
        } catch (e) {
          console.warn('Notification failed:', e);
        }
      }

      toast({
        title: "Success",
        description: "Child checked in successfully",
      });

      setSelectedChild('');
      setSelectedClass('');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check in child",
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
          <DialogTitle>Manual Check-In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Child</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a child..." />
              </SelectTrigger>
              <SelectContent>
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Select Class (Optional)</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Class</SelectItem>
                {classes.map((classItem: any) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
