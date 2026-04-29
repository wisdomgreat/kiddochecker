import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useClasses } from '@/hooks/useClasses';
import { Users, Clock, StickyNote, ActivitySquare, AlertTriangle, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (classId: string, specialInstructions: string, hasFever: boolean, hasCough: boolean) => void;
  childName: string;
  initialClassId?: string;
}

const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
  initialClassId,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [hasFever, setHasFever] = useState<boolean | null>(null);
  const [hasCough, setHasCough] = useState<boolean | null>(null);
  const { classes, isLoading } = useClasses();
  const { t } = useTranslation();
  const { settings } = useSettings();

  React.useEffect(() => {
    if (open && initialClassId) {
      setSelectedClass(initialClassId);
    } else if (open) {
      setSelectedClass('');
    }
  }, [open, initialClassId]);

  const handleConfirm = () => {
    if (selectedClass) {
      onConfirm(selectedClass, instructions, hasFever || false, hasCough || false);
      setInstructions('');
    }
  };

  const showWellnessCheck = settings?.show_wellness_check !== false;
  const wellnessPassed = !showWellnessCheck || (hasFever === false && hasCough === false);
  const wellnessAttempted = !showWellnessCheck || (hasFever !== null && hasCough !== null);
  const canProceed = selectedClass && wellnessPassed && wellnessAttempted;

  return (
    <Dialog open={open} onValueChange={onClose} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Check-in Process</p>
          <DialogTitle className="text-2xl font-bold tracking-tight">{childName}</DialogTitle>
          <DialogDescription>
            Confirm destination class and wellness status
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm font-bold uppercase">Updating classes...</div>
          ) : (
            <div className="space-y-8">
              {/* Class Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    Target Class
                </div>
                <RadioGroup value={selectedClass} onValueChange={setSelectedClass} className="grid grid-cols-1 gap-2">
                  {classes?.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      className={cn(
                        "relative flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/30",
                        selectedClass === cls.id ? "border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-900" : "border-slate-200"
                      )}
                    >
                      <RadioGroupItem value={cls.id} id={cls.id} className="sr-only" />
                      <div className="flex-1 space-y-1">
                          <Label htmlFor={cls.id} className="font-bold text-sm cursor-pointer block">{cls.name}</Label>
                          {cls.age_range && (
                            <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {cls.age_range}
                            </p>
                          )}
                      </div>
                      {selectedClass === cls.id && <Check className="w-4 h-4" />}
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Wellness Check */}
              {showWellnessCheck && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                      <ActivitySquare className="w-3.5 h-3.5" />
                      {t('wellnessSurvey')}
                  </div>
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">{t('wellnessQuestion1')}</Label>
                      <div className="flex gap-2">
                        <Button 
                            variant={hasFever === true ? "destructive" : "outline"} 
                            size="sm" 
                            className="flex-1 h-10 font-bold"
                            onClick={() => setHasFever(true)}
                        >Yes</Button>
                        <Button 
                            variant={hasFever === false ? "default" : "outline"} 
                            size="sm" 
                            className="flex-1 h-10 font-bold"
                            onClick={() => setHasFever(false)}
                        >No</Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-bold">{t('wellnessQuestion2')}</Label>
                      <div className="flex gap-2">
                        <Button 
                            variant={hasCough === true ? "destructive" : "outline"} 
                            size="sm" 
                            className="flex-1 h-10 font-bold"
                            onClick={() => setHasCough(true)}
                        >Yes</Button>
                        <Button 
                            variant={hasCough === false ? "default" : "outline"} 
                            size="sm" 
                            className="flex-1 h-10 font-bold"
                            onClick={() => setHasCough(false)}
                        >No</Button>
                      </div>
                    </div>
                  </div>
                  {(hasFever === true || hasCough === true) && (
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start gap-3 mt-4">
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        <p className="text-xs font-bold text-destructive leading-relaxed">{t('wellnessFail')}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Instructions */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                    <StickyNote className="w-3.5 h-3.5" />
                    {t('specialInstructions')}
                </div>
                <Textarea 
                  placeholder="Notes for staff (optional)..."
                  className="resize-none min-h-[80px]"
                  maxLength={150}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t gap-3 sm:gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 font-bold h-11 uppercase tracking-tight text-xs">
            Abort
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canProceed} 
            className="flex-1 font-bold h-11 uppercase tracking-tight text-xs"
          >
            {hasFever || hasCough 
              ? "Health Alert" 
              : !selectedClass 
                ? "Select Class" 
                : showWellnessCheck && !wellnessAttempted 
                  ? "Pending Survey" 
                  : "Finalize Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

