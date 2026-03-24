import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format, addDays, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Plus, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ShiftManagementPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);

  const [formData, setFormData] = useState({
    staff_id: '',
    class_id: '',
    start_time: '09:00',
    end_time: '17:00',
    role_type: 'volunteer',
    notes: ''
  });

  // Queries
  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['all-staff-scheduling'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_recipients');
      if (error) throw error;
      return data || [];
    }
  });

  // Real-time updates
  React.useEffect(() => {
    const channel = supabase
      .channel('shifts-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: classes = [] } = useQuery({
    queryKey: ['all-classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('id, name');
      return data || [];
    }
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['shifts', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          staff:profiles(first_name, last_name),
          class:classes(name)
        `)
        .or(`start_time.gte.${start},end_time.lte.${end}`)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (newShift: any) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const start = `${dateStr}T${newShift.start_time}:00`;
      const end = `${dateStr}T${newShift.end_time}:00`;

      const { data, error } = await supabase.from('shifts').insert({
        staff_id: newShift.staff_id,
        class_id: newShift.class_id || null,
        start_time: start,
        end_time: end,
        role_type: newShift.role_type,
        notes: newShift.notes,
        status: 'scheduled'
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setIsAddDialogOpen(false);
      toast({ title: "Shift Scheduled", description: "The staff member has been assigned." });
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: "Shift Removed" });
    }
  });

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_id) {
      toast({ title: "Staff Required", variant: "destructive" });
      return;
    }
    createShiftMutation.mutate(formData);
  };

  const changeDate = (days: number) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Briefcase className="h-10 w-10 text-indigo-600" /> Staff Scheduling
            </h1>
            <p className="text-slate-500 font-medium">Manage shifts and center coverage.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 px-6 gap-2 shadow-xl shadow-indigo-200">
                <Plus className="h-4 w-4" /> Schedule Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Schedule New Shift</DialogTitle>
                <CardDescription>Assign a staff member to a class or role.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleCreateShift} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, staff_id: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select staff..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Class (Optional)</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select class..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / No Class</SelectItem>
                      {classes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role_type} onValueChange={(v) => setFormData({ ...formData, role_type: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="leader">Lead Teacher</SelectItem>
                      <SelectItem value="admin">Admin Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional shift notes..." className="rounded-xl" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createShiftMutation.isPending} className="w-full bg-indigo-600 rounded-xl">
                    {createShiftMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Shift"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:bg-white/80">
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-indigo-50 text-indigo-600 transition-colors" onClick={() => changeDate(-1)}><ChevronLeft className="h-6 w-6" /></Button>
          <div className="text-center group cursor-pointer" onClick={() => setSelectedDate(new Date())}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Schedule for</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{format(selectedDate, 'EEEE, MMM dd')}</h2>
          </div>
          <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-indigo-50 text-indigo-600 transition-colors" onClick={() => changeDate(1)}><ChevronRight className="h-6 w-6" /></Button>
        </div>

        {/* Shift Grid/List */}
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-800">Daily Coverage</CardTitle>
              <CardDescription className="uppercase text-xs font-black tracking-widest text-slate-400">Scheduled staff for this date</CardDescription>
            </div>
            <Badge variant="outline" className="bg-slate-50 border-slate-100 text-xs font-bold py-1 px-3 rounded-full">{shifts.length} Shifts</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {loadingShifts ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-100" /></div>
            ) : shifts.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="pl-8 text-xs font-black uppercase tracking-widest text-slate-400">Staff Member</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">Timing</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Class</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400">Role</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift: any) => (
                    <TableRow key={shift.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                            {shift.staff?.first_name[0]}{shift.staff?.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{shift.staff?.first_name} {shift.staff?.last_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{shift.status}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-sm font-bold">
                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] uppercase px-2 h-6">
                          {shift.class?.name || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <Badge 
                            variant="outline" 
                            className={cn(
                                "text-[9px] font-black uppercase border-none h-6 px-3",
                                shift.role_type === 'leader' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                            )}
                         >
                            {shift.role_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600" onClick={() => deleteShiftMutation.mutate(shift.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <CalendarIcon className="h-10 w-10 text-slate-200" />
                </div>
                <div>
                    <p className="text-slate-400 font-bold italic">No shifts scheduled for this date.</p>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Select another date or click "Schedule Shift"</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default ShiftManagementPage;
