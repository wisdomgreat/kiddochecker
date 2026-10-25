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
import { Users, Clock, StickyNote, ActivitySquare, AlertTriangle, Check, Lock } from 'lucide-react';
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
    <Dialog open={open} onValueChange={onClose} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">
            {isEs ? "Proceso de Registro" : "Check-in Process"}
          </p>
          <DialogTitle className="text-2xl font-bold tracking-tight">{childName}</DialogTitle>
          <DialogDescription>
            {isEs ? "Confirme el estado de salud antes de registrar entrada" : "Confirm wellness status before completing check-in"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm font-bold uppercase">
              {isEs ? "Actualizando..." : "Loading..."}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assigned Class Banner */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-blue-400">
                    <Users className="w-3.5 h-3.5" />
                    {isEs ? "Clase Asignada Automáticamente" : "Assigned Classroom"}
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {classes?.find(c => c.id === selectedClass)?.name || "Primary Campers"}
                  </h4>
                  {classes?.find(c => c.id === selectedClass)?.age_range && (
                    <p className="text-xs text-slate-400 font-medium">
                      {classes.find(c => c.id === selectedClass)?.age_range}
                    </p>
                  )}
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-xs font-black px-3 py-1 uppercase">
                  {isEs ? "✓ Auto-Asignada" : "✓ Auto-Assigned"}
                </Badge>
              </div>

              {/* Wellness Check */}
              {showWellnessCheck && (
                <div className="space-y-4 pt-2">
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
                        >{isEs ? "Sí" : "Yes"}</Button>
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
                        >{isEs ? "Sí" : "Yes"}</Button>
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
                  placeholder={isEs ? "Notas para el personal (opcional)..." : "Notes for staff (optional)..."}
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
            {isEs ? "Cancelar" : "Abort"}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canProceed} 
            className="flex-1 font-bold h-11 uppercase tracking-tight text-xs"
          >
            {hasFever || hasCough 
              ? (isEs ? "Alerta de Salud" : "Health Alert") 
              : !selectedClass 
                ? (isEs ? "Seleccionar Clase" : "Select Class") 
                : showWellnessCheck && !wellnessAttempted 
                  ? (isEs ? "Encuesta Pendiente" : "Pending Survey") 
                  : (isEs ? "Finalizar Entrada" : "Finalize Entry")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionDialog;

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

