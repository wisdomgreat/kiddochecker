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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClasses } from '@/hooks/useClasses';
import { Users, StickyNote, Activity, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';

interface ClassSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (classId: string, specialInstructions: string, hasFever: boolean, hasCough: boolean) => void;
  childName: string;
  initialClassId?: string;
  orgId?: string;
}

const ClassSelectionDialog: React.FC<ClassSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  childName,
  initialClassId,
  orgId,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [hasFever, setHasFever] = useState<boolean | null>(null);
  const [hasCough, setHasCough] = useState<boolean | null>(null);
  const { classes, isLoading } = useClasses(orgId);
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { language } = useLanguage();
  const isEs = language === 'es';

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border border-border">
        <DialogHeader className="p-6 bg-muted/30 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {isEs ? "Proceso de registro" : "Check-in verification"}
          </span>
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">{childName}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEs ? "Confirme la clase y el estado de salud antes de registrar entrada" : "Confirm room assignment and wellness status before completing check-in"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">
              {isEs ? "Cargando clases..." : "Loading classrooms..."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assigned Class Banner */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Users className="w-3.5 h-3.5" />
                    <span>{isEs ? "Clase asignada automáticamente" : "Assigned classroom"}</span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground">
                    {classes?.find(c => c.id === selectedClass)?.name || "Primary Campers"}
                  </h4>
                  {classes?.find(c => c.id === selectedClass)?.age_range && (
                    <p className="text-xs text-muted-foreground">
                      {classes.find(c => c.id === selectedClass)?.age_range}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2.5 py-1">
                  {isEs ? "Auto-asignada" : "Auto-assigned"}
                </Badge>
              </div>

              {/* Wellness Check */}
              {showWellnessCheck && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                    <span>{t('wellnessSurvey')}</span>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">{t('wellnessQuestion1')}</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={hasFever === true ? "destructive" : "outline"} 
                          size="sm" 
                          className="flex-1 h-10 font-medium rounded-lg transition-colors"
                          onClick={() => setHasFever(true)}
                        >
                          {isEs ? "Sí" : "Yes"}
                        </Button>
                        <Button 
                          variant={hasFever === false ? "default" : "outline"} 
                          size="sm" 
                          className="flex-1 h-10 font-medium rounded-lg transition-colors"
                          onClick={() => setHasFever(false)}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">{t('wellnessQuestion2')}</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={hasCough === true ? "destructive" : "outline"} 
                          size="sm" 
                          className="flex-1 h-10 font-medium rounded-lg transition-colors"
                          onClick={() => setHasCough(true)}
                        >
                          {isEs ? "Sí" : "Yes"}
                        </Button>
                        <Button 
                          variant={hasCough === false ? "default" : "outline"} 
                          size="sm" 
                          className="flex-1 h-10 font-medium rounded-lg transition-colors"
                          onClick={() => setHasCough(false)}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                  {(hasFever === true || hasCough === true) && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-destructive leading-relaxed">{t('wellnessFail')}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Instructions */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <StickyNote className="w-3.5 h-3.5 text-primary" />
                  <span>{t('specialInstructions')}</span>
                </div>
                <Textarea 
                  placeholder={isEs ? "Notas para el maestro o voluntario (opcional)..." : "Notes for teacher or room volunteer (optional)..."}
                  className="resize-none min-h-[72px] text-xs rounded-lg"
                  maxLength={150}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex flex-row items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="h-10 px-4 text-xs font-medium rounded-lg">
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canProceed} 
            className="h-10 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {hasFever || hasCough 
              ? (isEs ? "Alerta de salud" : "Health alert") 
              : !selectedClass 
                ? (isEs ? "Seleccionar clase" : "Select class") 
                : showWellnessCheck && !wellnessAttempted 
                  ? (isEs ? "Encuesta pendiente" : "Pending survey") 
                  : (isEs ? "Confirmar entrada" : "Confirm check-in")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;
