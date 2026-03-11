import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useClasses } from '@/hooks/useClasses';
import { Users, Clock, StickyNote } from 'lucide-react';

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (classId: string, specialInstructions: string) => void;
  childName: string;
}

const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const { classes, isLoading } = useClasses();

  const handleConfirm = () => {
    if (selectedClass) {
      onConfirm(selectedClass, instructions);
      setInstructions(''); // reset for next time
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Class for {childName}</DialogTitle>
          <DialogDescription>
            Please select which class to check this child into
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Loading classes...</div>
        ) : (
          <div className="space-y-6">
            <RadioGroup value={selectedClass} onValueChange={setSelectedClass}>
              <div className="space-y-3">
                {classes?.map((cls) => (
                  <Card
                    key={cls.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedClass === cls.id ? 'border-primary border-2 bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedClass(cls.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={cls.id} id={cls.id} />
                      <Label htmlFor={cls.id} className="flex-1 cursor-pointer">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{cls.name}</h3>
                          {cls.description && (
                            <p className="text-sm text-muted-foreground">{cls.description}</p>
                          )}
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {cls.age_range && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {cls.age_range}
                              </span>
                            )}
                            {cls.capacity && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Capacity: {cls.capacity}
                              </span>
                            )}
                            {cls.room && (
                              <span>Room: {cls.room}</span>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
            
            <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
              <Label htmlFor="instructions" className="flex items-center gap-2 text-primary font-semibold">
                <StickyNote className="w-4 h-4" />
                Special Instructions (Optional)
              </Label>
              <Textarea 
                id="instructions"
                placeholder="e.g., Nap at 2 PM, Aunt Mary is picking up today, needs extra snack..."
                className="resize-none focus-visible:ring-primary/50"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Notes will be visible to staff and printed on the name tag.</span>
                <span className={instructions.length > 150 ? "text-destructive" : ""}>{instructions.length}/150</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedClass} className="flex-1">
            Confirm Check-In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;
