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
import { Card } from '@/components/ui/card';
import { useClasses } from '@/hooks/useClasses';
import { Users, Clock } from 'lucide-react';

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (classId: string) => void;
  childName: string;
}

const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const { classes, isLoading } = useClasses();

  const handleConfirm = () => {
    if (selectedClass) {
      onConfirm(selectedClass);
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
