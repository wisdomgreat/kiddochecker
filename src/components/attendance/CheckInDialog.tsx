import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

import { useAuth } from '@/hooks/useAuth';
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
        classId: (selectedClass && selectedClass !== 'none') ? selectedClass : undefined,
        checkedInBy: user?.id,
        method: 'staff_dashboard',
        station: 'Manual Dashboard',
        deviceId: user?.user_metadata?.device_id
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
      <DialogContent className="sm:max-w-[500px] p-0 border-none bg-background shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="bg-primary p-10 text-primary-foreground relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-background/10 backdrop-blur-md border border-background/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Manual Admission Terminal</span>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-2">
              Staff Authorization
            </DialogTitle>
            <p className="text-sm text-white/70 font-medium leading-relaxed mt-4">
              Authorized manual check-in for children without physical credentials. This action will be logged in the permanent audit trail.
            </p>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Child from Registry</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background transition-all font-bold px-4">
                <SelectValue placeholder="Begin typing or select..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50 max-h-[300px]">
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id} className="font-bold py-3">
                    {child.first_name} {child.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Learning Environment</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-transparent focus:bg-background transition-all font-bold px-4">
                <SelectValue placeholder="Assign to a class (optional)..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50">
                <SelectItem value="none" className="italic font-medium">No Class Assignment</SelectItem>
                {classes.map((classItem: any) => (
                  <SelectItem key={classItem.id} value={classItem.id} className="font-bold py-3">
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="p-10 bg-muted/50 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full px-6 font-bold text-xs">Cancel</Button>
          <Button 
            onClick={handleCheckIn} 
            disabled={isLoading}
            className="rounded-full px-10 h-14 font-black text-[11px] uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl hover:shadow-primary/20 hover:-translate-y-1 active:translate-y-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Authorize Check-in"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

