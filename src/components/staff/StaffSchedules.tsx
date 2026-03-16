import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShifts, Shift } from '@/hooks/useShifts';
import { useClasses } from '@/hooks/useClasses';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
  Edit2,
  Trash2,
  Zap,
  RotateCcw
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
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
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
  const queryClient = useQueryClient();

  const { data: staffList } = useQuery({
    queryKey: ['staff-list-profiles-v2'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_recipients');
      if (error) throw error;
      
      return data.filter((r: any) => 
        ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer'].includes(r.role?.toLowerCase())
      );
    }
  });

  React.useEffect(() => {
    const channel = supabase
      .channel('shifts-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleCreateShift = async () => {
    if (!newShift.staff_id || !newShift.start_time || !newShift.end_time) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingShift) {
        await updateShift.mutateAsync({
          id: editingShift.id,
          staff_id: newShift.staff_id,
          class_id: newShift.class_id || undefined,
          start_time: new Date(newShift.start_time).toISOString(),
          end_time: new Date(newShift.end_time).toISOString(),
          role_type: newShift.role_type,
          notes: newShift.notes
        });
        toast({ title: "Shift Updated", description: "The assignment change has been saved." });
      } else {
        await createShift.mutateAsync({
          staff_id: newShift.staff_id,
          class_id: newShift.class_id || undefined,
          start_time: new Date(newShift.start_time).toISOString(),
          end_time: new Date(newShift.end_time).toISOString(),
          role_type: newShift.role_type,
          notes: newShift.notes,
          status: 'scheduled'
        });
        toast({ title: "Shift Created", description: "The staff member has been assigned." });
      }
      setShowAddDialog(false);
      setEditingShift(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditClick = (shift: Shift) => {
    setEditingShift(shift);
    setNewShift({
      staff_id: shift.staff_id,
      class_id: shift.class_id || '',
      start_time: format(new Date(shift.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(shift.end_time), "yyyy-MM-dd'T'HH:mm"),
      role_type: shift.role_type,
      notes: shift.notes || ''
    });
    setShowAddDialog(true);
  };

  const handleSwapShift = async (shift: Shift, newStaffId: string) => {
    try {
      await updateShift.mutateAsync({
        id: shift.id,
        staff_id: newStaffId
      });
      toast({ title: "Shift Swapped", description: "Personnel reassigned successfully." });
    } catch (error: any) {
      toast({ title: "Swap Failed", description: error.message, variant: "destructive" });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 mb-2 font-black">Center Operations</Badge>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 group flex items-center gap-3">
            Staff & Volunteer Scheduling
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-3" />
          </h1>
          <p className="text-slate-500 font-medium">Shift management and check-in accountability</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowAutoSchedule(true)}
            className="rounded-xl border-slate-200 h-11 px-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all border-dashed"
          >
            <Zap className="h-4 w-4 mr-2 text-amber-500" />
            Auto-Plan
          </Button>

          <Dialog open={showAddDialog} onOpenChange={(val) => {
            setShowAddDialog(val);
            if (!val) {
              setEditingShift(null);
              setNewShift({
                staff_id: '',
                class_id: '',
                start_time: format(new Date(), "yyyy-MM-dd'T'09:00"),
                end_time: format(new Date(), "yyyy-MM-dd'T'17:00"),
                role_type: 'volunteer' as Shift['role_type'],
                notes: ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                <Plus className="h-4 w-4" /> Schedule Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-8 border-none shadow-3xl bg-white/80 backdrop-blur-xl">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                  {editingShift ? "Edit Shift Details" : "Schedule New Shift"}
                </DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  {editingShift ? "Modify the current assignment for this time window." : "Assign a staff member or volunteer to a specific role."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 ml-1">Team Member</Label>
                  <Select value={newShift.staff_id} onValueChange={(val) => setNewShift(prev => ({ ...prev, staff_id: val }))}>
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm">
                      <SelectValue placeholder="Select Staff" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {staffList?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Class (Optional)</Label>
                    <Select value={newShift.class_id} onValueChange={(val) => setNewShift(prev => ({ ...prev, class_id: val }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {classes?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Role Type</Label>
                    <Select value={newShift.role_type} onValueChange={(val: any) => setNewShift(prev => ({ ...prev, role_type: val }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
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
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">Start Time</Label>
                    <Input 
                      type="datetime-local" 
                      value={newShift.start_time} 
                      onChange={e => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                      className="h-12 rounded-2xl border-slate-200 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400 ml-1">End Time</Label>
                    <Input 
                      type="datetime-local" 
                      value={newShift.end_time} 
                      onChange={e => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                      className="h-12 rounded-2xl border-slate-200 bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-400 ml-1">Shift Notes</Label>
                  <Input 
                    placeholder="E.g. Room preparation, main lesson lead..." 
                    value={newShift.notes} 
                    onChange={e => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                    className="h-12 rounded-2xl border-slate-200 bg-white/50"
                  />
                </div>
              </div>

              <DialogFooter className="mt-8 border-t border-slate-50 pt-6">
                <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="rounded-xl font-bold text-slate-400 hover:text-slate-600">Cancel</Button>
                <Button onClick={handleCreateShift} disabled={createShift.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 font-black uppercase tracking-widest text-[10px]">
                  {createShift.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingShift ? "Save Changes" : "Create Assignment")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-fit mb-4">
        {[-2, -1, 0, 1, 2].map((offset) => {
          const d = addDays(new Date(), offset);
          const active = isSameDay(d, selectedDate);
          return (
            <button
              key={offset}
              onClick={() => setSelectedDate(startOfDay(d))}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all uppercase tracking-tight ${
                active ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              {isSameDay(d, new Date()) ? 'Today' : format(d, 'EEE d')}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">Compiling Roster...</p>
              </div>
            ) : shifts && shifts.length > 0 ? (
              shifts.map((shift, idx) => (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-none shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_-8px_rgba(99,102,241,0.1)] transition-all bg-white group overflow-hidden relative border-l-4 border-l-transparent hover:border-l-indigo-500">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all duration-500 overflow-hidden relative">
                         {shift.profiles?.avatar_url ? (
                           <img src={shift.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-lg">{shift.profiles?.first_name[0]}{shift.profiles?.last_name[0]}</span>
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-extrabold text-slate-900 tracking-tight text-xl">
                            {shift.profiles?.first_name} {shift.profiles?.last_name}
                          </h4>
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-tight px-2 py-0 h-5 border-none ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                          <span className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                          </span>
                          {shift.classes && (
                            <span className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-indigo-50/50 px-2 py-1 rounded-lg">
                              <Users className="h-3.5 w-3.5 text-indigo-400" />
                              {shift.classes.name}
                            </span>
                          )}
                          <span className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50/50 px-2 py-1 rounded-lg">
                            <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                            {shift.role_type}
                          </span>
                        </div>
                        {shift.notes && (
                          <div className="mt-3 flex gap-2 items-start opacity-60 group-hover:opacity-100 transition-opacity">
                            <AlertCircle className="h-3 w-3 mt-0.5 text-indigo-400" />
                            <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed">{shift.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <Select onValueChange={(val) => handleSwapShift(shift, val)}>
                          <SelectTrigger className="h-9 w-9 p-0 border-none bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                            <Users className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-3xl min-w-[200px]">
                            <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Reassign Position</h4>
                               <p className="text-[10px] text-slate-400 font-bold mt-1">Select a replacement staff member</p>
                            </div>
                            {staffList?.map(s => (
                              <SelectItem key={s.id} value={s.id} disabled={s.id === shift.staff_id} className="text-xs font-bold py-2.5">
                                {s.first_name} {s.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 w-9 p-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl"
                          onClick={() => handleEditClick(shift)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-9 w-9 p-0 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl"
                          onClick={() => {
                            if(confirm("Permanently archive this shift?")) deleteShift.mutate(shift.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                  <Calendar className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Deck Empty</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">No logistical assignments identified for {format(selectedDate, 'EEEE')}.</p>
                <Button 
                  variant="outline" 
                  className="mt-8 rounded-2xl border-slate-200 h-12 px-8 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50"
                  onClick={() => setShowAddDialog(true)}
                >
                  Create Deployment
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          <Card className="border-none bg-indigo-950 text-white rounded-[3rem] shadow-3xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><RotateCcw className="h-48 w-48" /></div>
            <div className="relative space-y-8">
              <Badge className="bg-white/10 text-indigo-200 border-white/20 text-[10px] font-black uppercase tracking-widest px-3">System Analysis</Badge>
              <div>
                <h3 className="text-3xl font-black mb-2 tracking-tighter">Compliance State</h3>
                <p className="text-indigo-300 text-xs font-medium leading-relaxed">Dynamic roster validation for {format(selectedDate, 'MMMM d, yyyy')}.</p>
              </div>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-[11px] font-black uppercase tracking-widest">Active Units</span>
                  <span className="font-black text-xl">{shifts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-[11px] font-black uppercase tracking-widest">Pending Confirmation</span>
                  <span className={`font-black text-xl ${shifts?.some(s => s.status === 'scheduled') ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {shifts?.filter(s => s.status === 'scheduled').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400 text-[11px] font-black uppercase tracking-widest">Coverage Health</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black">STABLE</Badge>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest h-14 shadow-xl shadow-indigo-950/50">
                   Generate Manifest
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 group overflow-hidden relative">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
               Scheduling Protocols
            </h4>
            <div className="space-y-8">
              {[
                { label: 'Staff Briefing', time: '8:45 AM', loc: 'Main Lobby', icon: Users },
                { label: 'Volunteer Sync', time: '9:15 AM', loc: 'Annex 1', icon: User },
                { label: 'Operational Review', time: '6:00 PM', loc: 'Admin Portal', icon: Briefcase }
              ].map((proto, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                    <proto.icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{proto.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{proto.time} • {proto.loc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showAutoSchedule} onOpenChange={setShowAutoSchedule}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 border-none shadow-3xl bg-white/95 backdrop-blur-xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
               <Zap className="h-8 w-8 text-amber-500" />
               Roster Engine AI
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-500 text-sm mt-3">
              Automated roster optimization based on current compliance tiers and historical occupancy patterns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 mb-10">
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 flex gap-4 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl font-black flex items-center justify-center text-indigo-500/10 text-9xl">?</div>
              <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="text-xs font-bold text-indigo-900 leading-relaxed pr-6">
                Optimization Engine detected a high-efficiency template matching your {format(selectedDate, 'EEEE')} requirements. 
                <div className="mt-4 flex gap-3">
                  <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                    <Users className="h-3 w-3 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">4 Staff</span>
                  </div>
                  <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                    <User className="h-3 w-3 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">2 Volunteers</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Heuristics Engine</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-14 rounded-2xl border-indigo-100 bg-white shadow-sm hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest text-indigo-600 gap-2">
                   Balance Workload
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest text-slate-400 gap-2">
                   Seniority Base
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowAutoSchedule(false)} className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 px-8 text-slate-400">Abort</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-12 font-black uppercase tracking-widest text-[10px] h-14 shadow-2xl shadow-indigo-200 grow" onClick={() => {
              toast({ title: "Deploying Roster", description: "Calculating optimal coverage patterns..." });
              setShowAutoSchedule(false);
            }}>
              Execute Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffSchedules;
