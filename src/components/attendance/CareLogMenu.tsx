import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { 
  Heart, Utensils, Baby, Clock, 
  ArrowRightLeft, Stethoscope, 
  CheckCircle2, PlusCircle, Sparkles,
  Droplets, Smile, FileText, Loader2,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface CareLogMenuProps {
  attendanceId: string;
  staffId: string;
  childName?: string;
  onLogAdded: () => void;
}

interface EventTypeConfig {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  badgeBg: string;
  defaultDetailLabel: string;
  quickOptions: string[];
  placeholder: string;
}

const CARE_EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'feeding',
    label: 'Meal & Feeding',
    icon: Utensils,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    badgeBg: 'border-orange-200 text-orange-700 bg-orange-50/80',
    defaultDetailLabel: 'Feeding Type',
    quickOptions: ['Morning Snack', 'Lunch', 'Afternoon Snack', 'Bottle / Milk', 'Water / Hydration'],
    placeholder: 'e.g. Ate all fruit and crackers, drank 150ml water...'
  },
  {
    id: 'potty',
    label: 'Diaper & Bathroom',
    icon: Baby,
    color: 'text-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    badgeBg: 'border-sky-200 text-sky-700 bg-sky-50/80',
    defaultDetailLabel: 'Status',
    quickOptions: ['Wet Diaper', 'Soiled Diaper', 'Dry Diaper Changed', 'Potty Used Successfully', 'Potty Routine Attempt'],
    placeholder: 'e.g. Clean diaper change completed with barrier cream...'
  },
  {
    id: 'nap',
    label: 'Nap & Rest Time',
    icon: Clock,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    badgeBg: 'border-indigo-200 text-indigo-700 bg-indigo-50/80',
    defaultDetailLabel: 'Nap State',
    quickOptions: ['Fell Asleep', 'Woke Up Happy', 'Quiet Rest Time', 'Full Nap (60m+)', 'Difficulty Settling'],
    placeholder: 'e.g. Slept peacefully from 1:00 PM to 2:15 PM...'
  },
  {
    id: 'transition',
    label: 'Room & Area Transition',
    icon: ArrowRightLeft,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    badgeBg: 'border-emerald-200 text-emerald-700 bg-emerald-50/80',
    defaultDetailLabel: 'Destination',
    quickOptions: ['Outdoor Playground', 'Gym / Sports Hall', 'Sanctuary / Chapel', 'Main Classroom', 'Library Corner'],
    placeholder: 'e.g. Group transitioned safely to the outdoor playground...'
  },
  {
    id: 'medication',
    label: 'Medication & Health',
    icon: Stethoscope,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    badgeBg: 'border-rose-200 text-rose-700 bg-rose-50/80',
    defaultDetailLabel: 'Health Care Action',
    quickOptions: ['Prescribed Dose Given', 'Temperature Check (Normal)', 'Bandage / Minor First Aid', 'Sunscreen Applied', 'Inhaler / Puffer Administered'],
    placeholder: 'e.g. Administered 5ml prescribed allergy liquid as per parent instructions...'
  },
  {
    id: 'behavior',
    label: 'Milestone & Behavior',
    icon: Smile,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    badgeBg: 'border-amber-200 text-amber-700 bg-amber-50/80',
    defaultDetailLabel: 'Behavior / Milestone',
    quickOptions: ['Shared Toys with Friends', 'Great Participation', 'Craft Masterpiece', 'Comforted a Friend', 'Listening Star'],
    placeholder: 'e.g. Showed wonderful leadership during group singing time...'
  },
  {
    id: 'special_note',
    label: 'General Staff Note',
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    badgeBg: 'border-purple-200 text-purple-700 bg-purple-50/80',
    defaultDetailLabel: 'Note Category',
    quickOptions: ['Parent Reminder', 'Lost & Found Item', 'Supplies Needed', 'Routine Adjustment', 'General Update'],
    placeholder: 'e.g. Left jacket in the blue cubby, please remind parent at pickup...'
  }
];

export const CareLogMenu: React.FC<CareLogMenuProps> = ({ 
  attendanceId, 
  staffId, 
  childName = 'Child',
  onLogAdded 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventTypeConfig | null>(null);
  const [selectedQuickOption, setSelectedQuickOption] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [customDetail, setCustomDetail] = useState<string>('');

  const openLogDialog = (eventType: EventTypeConfig) => {
    setSelectedEventType(eventType);
    setSelectedQuickOption(eventType.quickOptions[0] || '');
    setNotes('');
    setCustomDetail('');
    setDialogOpen(true);
  };

  const handleSaveCareLog = async () => {
    if (!selectedEventType) return;
    setLoading(true);

    try {
      const payload = {
        attendance_id: attendanceId,
        staff_id: staffId || null,
        event_type: selectedEventType.id,
        notes: notes.trim() || selectedQuickOption || null,
        details: {
          category: selectedEventType.label,
          type: selectedQuickOption || customDetail || selectedEventType.id,
          custom_detail: customDetail || undefined,
          notes: notes.trim() || undefined,
          logged_at: new Date().toISOString(),
          child_name: childName
        }
      };

      const { error } = await supabase.from('care_logs').insert(payload);

      if (error) {
        throw error;
      }

      toast({ 
        title: "Duty of Care Logged ✓", 
        description: `${selectedEventType.label} recorded for ${childName}.`,
      });

      setDialogOpen(false);
      onLogAdded();
    } catch (err: any) {
      console.error('[CareLogMenu] Error logging event:', err);
      toast({ 
        title: "Could not save Care Log", 
        description: err.message || "Please check database connection.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
            title="Log Duty of Care Action"
          >
            <PlusCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-slate-200/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Duty of Care Ledger</p>
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{childName}</p>
          </div>
          
          <div className="py-1 space-y-0.5">
            {CARE_EVENT_TYPES.map((typeConfig) => {
              const IconComponent = typeConfig.icon;
              return (
                <DropdownMenuItem 
                  key={typeConfig.id}
                  onClick={() => openLogDialog(typeConfig)} 
                  className="rounded-xl gap-3 py-2 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group"
                >
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", typeConfig.bgColor)}>
                    <IconComponent className={cn("h-4 w-4", typeConfig.color)} />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{typeConfig.label}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Enhanced Duty of Care Logging Modal with Notes & Customization */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl rounded-3xl overflow-hidden">
          {selectedEventType && (
            <>
              {/* Dynamic Header */}
              <div className={cn("p-6 relative overflow-hidden border-b border-slate-100 dark:border-slate-800", selectedEventType.bgColor)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200/60 dark:border-slate-800 flex items-center justify-center">
                      {React.createElement(selectedEventType.icon, { className: cn("h-5 w-5", selectedEventType.color) })}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Duty of Care Action</span>
                      <DialogTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">
                        {selectedEventType.label}
                      </DialogTitle>
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3 flex items-center gap-1.5">
                  Recording event for: <span className="font-black text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2">{childName}</span>
                </p>
              </div>

              {/* Form Controls */}
              <div className="p-6 space-y-5">
                {/* Quick Presets */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Preset
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEventType.quickOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedQuickOption(opt)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          selectedQuickOption === opt
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Notes & Observations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Detailed Notes & Observations
                    </Label>
                    <span className="text-[10px] font-bold text-slate-400">Optional</span>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={selectedEventType.placeholder}
                    className="min-h-[100px] rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 resize-none font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="p-6 pt-0 flex gap-3 sm:justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                  className="rounded-xl font-bold text-xs h-11 px-5"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveCareLog}
                  disabled={loading}
                  className="rounded-xl font-black uppercase tracking-wider text-xs h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Record Event
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CareLogMenu;
