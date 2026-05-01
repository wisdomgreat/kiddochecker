
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Heart, Utensils, Baby, Clock, 
  ArrowRightLeft, Stethoscope, 
  CheckCircle2, PlusCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

interface CareLogMenuProps {
  attendanceId: string;
  staffId: string;
  onLogAdded: () => void;
}

const CareLogMenu: React.FC<CareLogMenuProps> = ({ attendanceId, staffId, onLogAdded }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const logEvent = async (type: string, details: any = {}) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('care_logs').insert({
        attendance_id: attendanceId,
        staff_id: staffId,
        event_type: type,
        details
      });

      if (error) throw error;

      toast({ 
        title: "Care Event Logged", 
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} recorded.`,
      });
      onLogAdded();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">Duty of Care</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => logEvent('feeding', { time: new Date().toISOString() })} className="rounded-xl gap-3 py-2.5">
          <Utensils className="h-4 w-4 text-orange-500" />
          <span className="font-medium text-sm">Log Feeding</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => logEvent('potty', { type: 'diaper', time: new Date().toISOString() })} className="rounded-xl gap-3 py-2.5">
          <Baby className="h-4 w-4 text-sky-500" />
          <span className="font-medium text-sm">Diaper/Potty</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => logEvent('nap', { status: 'started', time: new Date().toISOString() })} className="rounded-xl gap-3 py-2.5">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-sm">Nap Time</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => logEvent('transition', { to: 'Gym', time: new Date().toISOString() })} className="rounded-xl gap-3 py-2.5">
          <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
          <span className="font-medium text-sm">Room Transition</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => logEvent('medication', { verified: true, time: new Date().toISOString() })} className="rounded-xl gap-3 py-2.5">
          <Stethoscope className="h-4 w-4 text-rose-500" />
          <span className="font-medium text-sm">Medication Dose</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CareLogMenu;
