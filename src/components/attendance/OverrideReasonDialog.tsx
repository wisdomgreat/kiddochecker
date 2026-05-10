
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShieldAlert, UserCheck } from 'lucide-react';
import useUserRoles from '@/hooks/useUserRoles';

interface OverrideReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, witnessId?: string) => void;
  childName: string;
}

const COMMON_REASONS = [
  "Parent forgot to check out",
  "Emergency early release - authorized",
  "Authorized pickup forgot security code",
  "Kiosk technical issue",
  "Child left with teacher/staff permission",
  "Other (see notes below)"
];

const OverrideReasonDialog: React.FC<OverrideReasonDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
}) => {
  const { data: users = [] } = useUserRoles();
  const staffMembers = users.filter(u => ['admin', 'staff', 'teacher'].includes(u.role));
  
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [witnessId, setWitnessId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleConfirm = () => {
    const finalReason = notes ? `${selectedReason}: ${notes}` : selectedReason;
    onConfirm(finalReason || "Manual override - no specific reason provided", witnessId);
    setSelectedReason('');
    setWitnessId('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Security Override</span>
          </div>
          <DialogTitle className="text-2xl font-bold">Manual Sign-out</DialogTitle>
          <DialogDescription className="text-slate-500">
            You are manually signing out <strong className="text-slate-900">{childName}</strong>. 
            This action requires a justification for legal and insurance compliance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-bold">Primary Reason</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {COMMON_REASONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="witness" className="font-bold">Witness (Staff Present)</Label>
              <Badge variant="outline" className="text-[9px] font-bold text-slate-400">Optional</Badge>
            </div>
            <Select value={witnessId} onValueChange={setWitnessId}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select a witnessing staff member..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {staffMembers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-bold">Additional Evidence/Notes</Label>
            <Textarea 
              id="notes" 
              placeholder="Provide specific details (e.g. name of person who picked up)" 
              className="rounded-xl min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 leading-normal">
              <strong>Note:</strong> Your ID, timestamp, and device metadata will be permanently attached to this override as a digital signature.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedReason}
            className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100"
          >
            Authorize Sign-out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverrideReasonDialog;
