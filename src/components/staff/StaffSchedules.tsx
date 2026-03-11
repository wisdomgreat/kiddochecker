import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShifts, Shift } from '@/hooks/useShifts';
import { useClasses } from '@/hooks/useClasses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const StaffSchedules = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newShift, setNewShift] = useState({
    staff_id: '',
    class_id: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'09:00"),
    end_time: format(new Date(), "yyyy-MM-dd'T'17:00"),
    role_type: 'volunteer' as Shift['role_type'],
    notes: ''
  });

  const { shifts, isLoading, createShift, updateShift, deleteShift } = useShifts({
    from: startOfDay(selectedDate),
    to: endOfDay(selectedDate)
  });

  const { classes } = useClasses();
  const { toast } = useToast();

  const { data: staffList } = useQuery({
    queryKey: ['staff-list-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .neq('role', 'parent')
        .order('first_name');
      if (error) throw error;
      return data;
    }
  });

  const handleCreateShift = async () => {
    if (!newShift.staff_id || !newShift.start_time || !newShift.end_time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      await createShift.mutateAsync({
        staff_id: newShift.staff_id,
        class_id: newShift.class_id || undefined,
        start_time: new Date(newShift.start_time).toISOString(),
        end_time: new Date(newShift.end_time).toISOString(),
        role_type: newShift.role_type,
        notes: newShift.notes,
        status: 'scheduled'
      });
      setShowAddDialog(false);
      toast({ title: "Success", description: "Shift scheduled successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: Shift['status']) => {
    try {
      await updateShift.mutateAsync({ id, status });
      toast({ title: "Status Updated", description: `Shift marked as ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'canceled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'absent': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Staff & Volunteer Scheduling</h2>
          <p className="text-slate-500 text-sm">Shift management and check-in accountability</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
            {[-1, 0, 1].map((offset) => {
              const d = addDays(new Date(), offset);
              const active = isSameDay(d, selectedDate);
              return (
                <button
                  key={offset}
                  onClick={() => setSelectedDate(d)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  {offset === 0 ? 'Today' : format(d, 'EEE d')}
                </button>
              );
            })}
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 gap-2">
                <Plus className="h-4 w-4" /> Schedule Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-800">Schedule New Shift</DialogTitle>
                <DialogDescription>Assign a staff member or volunteer to a specific role.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Team Member</Label>
                  <Select onValueChange={(val) => setNewShift(prev => ({ ...prev, staff_id: val }))}>
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue placeholder="Select Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Class (Optional)</Label>
                    <Select onValueChange={(val) => setNewShift(prev => ({ ...prev, class_id: val }))}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Role Type</Label>
                    <Select value={newShift.role_type} onValueChange={(val: any) => setNewShift(prev => ({ ...prev, role_type: val }))}>
                      <SelectTrigger className="rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">Leader</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="volunteer">Volunteer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Start Time</Label>
                    <Input 
                      type="datetime-local" 
                      value={newShift.start_time} 
                      onChange={e => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">End Time</Label>
                    <Input 
                      type="datetime-local" 
                      value={newShift.end_time} 
                      onChange={e => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400">Shift Notes</Label>
                  <Input 
                    placeholder="E.g. Room preparation, main lesson lead..." 
                    value={newShift.notes} 
                    onChange={e => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateShift} disabled={createShift.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8">
                  {createShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Shift"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Loading Roster...</p>
              </div>
            ) : shifts && shifts.length > 0 ? (
              shifts.map((shift, idx) => (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all bg-white group overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-1 h-full ${shift.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity'}`} />
                    <CardContent className="p-5 flex items-center gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        {shift.profiles?.first_name[0]}{shift.profiles?.last_name[0]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800 tracking-tight">{shift.profiles?.first_name} {shift.profiles?.last_name}</h4>
                          <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter px-1.5 h-4 ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                            <Clock className="h-3 w-3 text-indigo-500/50" />
                            {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                          </span>
                          {shift.classes && (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                              <Users className="h-3 w-3 text-indigo-500/50" />
                              {shift.classes.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                            <Briefcase className="h-3 w-3 text-indigo-500/50" />
                            {shift.role_type}
                          </span>
                        </div>
                        {shift.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-1.5 leading-relaxed">"{shift.notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {shift.status === 'scheduled' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                              onClick={() => updateStatus(shift.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-600 rounded-lg"
                              onClick={() => updateStatus(shift.id, 'canceled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 rounded-lg"
                          onClick={() => {
                            if(confirm("Permanently remove this shift?")) deleteShift.mutate(shift.id);
                          }}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="font-black text-slate-400 text-lg">No Shifts Scheduled</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">There are no team members assigned for {format(selectedDate, 'MMMM d')}.</p>
                <Button 
                  variant="outline" 
                  className="mt-6 rounded-xl border-slate-200 text-slate-500 hover:bg-white"
                  onClick={() => setShowAddDialog(true)}
                >
                  Create First Assignment
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="h-40 w-40" /></div>
            <div className="relative space-y-6">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-black uppercase">Schedule Health</Badge>
              <div>
                <h3 className="text-xl font-black mb-1">Compliance Matrix</h3>
                <p className="text-slate-400 text-xs leading-relaxed">System scan for {format(selectedDate, 'MMM d')}.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">Assigned Roles</span>
                  <span className="font-black">{shifts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">Unconfirmed Shifts</span>
                  <span className="font-black text-amber-400">
                    {shifts?.filter(s => s.status === 'scheduled').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">Class Coverage</span>
                  <span className="font-black text-emerald-400">Optimal</span>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl text-[10px] font-black uppercase tracking-widest h-11">
                  Export Shift Manifesto
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">Upcoming Benchmarks</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs font-black text-slate-700">Staff Briefing</p>
                  <p className="text-[10px] text-slate-400 font-bold">8:45 AM • Main Lobby</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-200 shrink-0" />
                <div>
                  <p className="text-xs font-black text-slate-700">Volunteer Orientation</p>
                  <p className="text-[10px] text-slate-400 font-bold">Tomorrow • 10:00 AM</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffSchedules;
