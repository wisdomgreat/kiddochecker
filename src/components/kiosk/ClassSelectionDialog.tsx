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
import { Users, Clock, StickyNote, ActivitySquare, AlertTriangle } from 'lucide-react';
import { useTranslation, Language } from '@/lib/i18n';

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (classId: string, specialInstructions: string) => void;
  childName: string;
  language?: Language;
}

const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
  language = 'en',
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [hasFever, setHasFever] = useState<boolean | null>(null);
  const [hasCough, setHasCough] = useState<boolean | null>(null);
  const { classes, isLoading } = useClasses();
  const { t } = useTranslation(language);

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
          <DialogTitle className="text-2xl">{t('selectChild').replace('...', '')} - {childName}</DialogTitle>
          <DialogDescription>
            {t('subtitle')}
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

            <div className="p-4 bg-muted/10 rounded-lg border border-border space-y-4">
              <Label className="flex items-center gap-2 text-primary font-semibold text-lg">
                <ActivitySquare className="w-5 h-5" />
                {t('wellnessSurvey')}
              </Label>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('wellnessQuestion1')}</Label>
                  <RadioGroup 
                    className="flex gap-4" 
                    value={hasFever === null ? '' : hasFever.toString()} 
                    onValueChange={(val) => setHasFever(val === 'true')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="fever-yes" />
                      <Label htmlFor="fever-yes">{t('yes')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="fever-no" />
                      <Label htmlFor="fever-no">{t('no')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('wellnessQuestion2')}</Label>
                  <RadioGroup 
                    className="flex gap-4" 
                    value={hasCough === null ? '' : hasCough.toString()} 
                    onValueChange={(val) => setHasCough(val === 'true')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="cough-yes" />
                      <Label htmlFor="cough-yes">{t('yes')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="cough-no" />
                      <Label htmlFor="cough-no">{t('no')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {(hasFever === true || hasCough === true) && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-destructive mt-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{t('wellnessFail')}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
              <Label htmlFor="instructions" className="flex items-center gap-2 text-primary font-semibold">
                <StickyNote className="w-4 h-4" />
                {t('specialInstructions')}
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
                <span>{t('addNotes')}</span>
                <span className={instructions.length > 150 ? "text-destructive" : ""}>{instructions.length}/150</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedClass || hasFever === null || hasCough === null || hasFever || hasCough} 
            className="flex-1"
          >
            {hasFever || hasCough ? t('wellnessFail') : t('checkIn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;
