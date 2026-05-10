
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface LogIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  attendanceId: string;
  childId: string;
  childName: string;
  staffId: string;
  onSuccess: () => void;
}

const LogIncidentDialog: React.FC<LogIncidentDialogProps> = ({
  open,
  onClose,
  attendanceId,
  childId,
  childName,
  staffId,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('injury');
  const [severity, setSeverity] = useState('low');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const handleSubmit = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('incidents').insert({
        attendance_id: attendanceId,
        child_id: childId,
        staff_id: staffId,
        type,
        severity,
        description,
        action_taken: actionTaken,
        parent_notified: false
      });

      if (error) throw error;

      toast({ title: "Incident Logged", description: "This report has been permanently linked to the session dossier." });
      onSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 border-none bg-background shadow-2xl rounded-[2.5rem] overflow-hidden">
        <div className="bg-destructive p-10 text-destructive-foreground relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/10 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-background/10 backdrop-blur-md border border-background/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Forensic Incident Report</span>
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter leading-none mb-2">
              Log Event: {childName}
            </DialogTitle>
            <p className="text-sm text-white/70 font-medium leading-relaxed mt-4">
              Documenting an accident or medical event creates a permanent, tamper-evident legal record within the child's session dossier.
            </p>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Event Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background transition-all font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50">
                  <SelectItem value="injury" className="font-bold">Injury/Accident</SelectItem>
                  <SelectItem value="medical" className="font-bold">Medical/Illness</SelectItem>
                  <SelectItem value="behavior" className="font-bold">Behavioral Issue</SelectItem>
                  <SelectItem value="other" className="font-bold">Other Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Criticality</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className={cn(
                  "h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background transition-all font-bold",
                  severity === 'high' && "text-destructive"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/50">
                  <SelectItem value="low" className="font-bold">Low (Minor)</SelectItem>
                  <SelectItem value="medium" className="font-bold">Medium</SelectItem>
                  <SelectItem value="high" className="text-destructive font-black">High (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observation Details</Label>
            <Textarea 
              placeholder="Provide a detailed, factual account of the event..." 
              className="rounded-2xl min-h-[120px] bg-muted/30 border-transparent focus:bg-background transition-all p-4 text-sm font-medium leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Response Action</Label>
            <Textarea 
              placeholder="e.g. Applied first aid, notified supervisor, contacted guardian..." 
              className="rounded-2xl min-h-[100px] bg-muted/30 border-transparent focus:bg-background transition-all p-4 text-sm font-medium leading-relaxed"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="p-10 bg-muted/50 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={onClose} className="rounded-full px-6 font-bold text-xs">Discard</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !description}
            className="rounded-full px-8 h-12 font-black text-[11px] uppercase tracking-[0.2em] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-xl hover:shadow-destructive/20 hover:-translate-y-1"
          >
            {loading ? "Archiving..." : "Seal & Log Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogIncidentDialog;
