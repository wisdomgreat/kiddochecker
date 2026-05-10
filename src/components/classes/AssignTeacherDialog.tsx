import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserCheck, Users, Baby, X, Plus, BookOpen } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignTeacherDialogProps {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────
function fullName(profiles: Record<string, any> | null | undefined, userId: string) {
  if (!profiles) return userId.slice(0, 8);
  return `${profiles.first_name ?? ''} ${profiles.last_name ?? ''}`.trim() || userId.slice(0, 8);
}

// ── component ─────────────────────────────────────────────────────────
export const AssignTeacherDialog = ({ classId, className, open, onOpenChange, onSuccess }: AssignTeacherDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');

  // 1. All staff-role users (just user_id + role, no join)
  const { data: staffRoles = [] } = useQuery({
    queryKey: ['all-staff-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['teacher', 'teacher_assistant', 'staff', 'volunteer']);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // 2. Profile lookup for those users
  const staffUserIds = staffRoles.map((r: any) => r.user_id);
  const { data: staffProfiles = [] } = useQuery({
    queryKey: ['staff-profiles', staffUserIds.join(',')],
    queryFn: async () => {
      if (staffUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', staffUserIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && staffUserIds.length > 0,
  });

  // Merge role + profile for the dropdown
  const profileMap = Object.fromEntries((staffProfiles as any[]).map((p: any) => [p.id, p]));
  const availableStaff: Array<{ user_id: string; role: string; displayName: string }> =
    staffRoles.map((r: any) => ({
      user_id: r.user_id,
      role: r.role,
      displayName: fullName(profileMap[r.user_id], r.user_id),
    }));

  // 3. Current assignments for this class
  const { data: assignedRaw = [], refetch: refetchStaff } = useQuery({
    queryKey: ['class-staff', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('user_id')
        .eq('class_id', classId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!classId,
  });

  const assignedUserIds = new Set((assignedRaw as any[]).map((r: any) => r.user_id));
  
  // Build enriched assignedStaff list
  const assignedStaff = (assignedRaw as any[]).map((r: any) => ({
    user_id: r.user_id,
    role: staffRoles.find((sr: any) => sr.user_id === r.user_id)?.role ?? 'staff',
    displayName: fullName(profileMap[r.user_id], r.user_id),
  }));

  const unassignedStaff = availableStaff.filter((s) => !assignedUserIds.has(s.user_id));

  // 4. All children
  const { data: allChildren = [] } = useQuery({
    queryKey: ['all-children-for-assign'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('children')
        .select('id, first_name, last_name, age, class_id')
        .order('first_name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // 5. Children already in this class
  const { data: classChildren = [], refetch: refetchChildren } = useQuery({
    queryKey: ['class-children', classId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('children')
        .select('id, first_name, last_name, age, allergies')
        .eq('class_id', classId)
        .order('first_name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!classId,
  });

  // ── handlers ──
  const handleAddStaff = async () => {
    if (!selectedStaff) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('teachers')
        .insert({ user_id: selectedStaff, class_id: classId });
      if (error) throw error;
      toast({ title: 'Staff assigned', description: 'Staff member added to class.' });
      setSelectedStaff('');
      refetchStaff();
      queryClient.invalidateQueries({ queryKey: ['class-staff', classId] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', userId);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Staff removed from class.' });
      refetchStaff();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAssignChild = async () => {
    if (!selectedChild) return;
    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('children')
        .update({ class_id: classId })
        .eq('id', selectedChild);
      if (error) throw error;
      toast({ title: 'Child assigned', description: 'Child added to class.' });
      setSelectedChild('');
      refetchChildren();
      queryClient.invalidateQueries({ queryKey: ['class-children', classId] });
      queryClient.invalidateQueries({ queryKey: ['all-children-for-assign'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('children')
        .update({ class_id: null })
        .eq('id', childId);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Child removed from class.' });
      refetchChildren();
      queryClient.invalidateQueries({ queryKey: ['class-children', classId] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Children not already in THIS class (can be re-assigned from another)
  const childrenNotInClass = (allChildren as any[]).filter((c: any) => c.class_id !== classId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Manage Class</DialogTitle>
              <p className="text-indigo-100 text-sm">{className}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="staff" className="w-full">
          <div className="border-b border-slate-100 px-6">
            <TabsList className="bg-transparent h-12 gap-6">
              <TabsTrigger
                value="staff"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-semibold gap-2"
              >
                <Users className="h-4 w-4" /> Staff ({assignedStaff.length})
              </TabsTrigger>
              <TabsTrigger
                value="children"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-semibold gap-2"
              >
                <Baby className="h-4 w-4" /> Children ({(classChildren as any[]).length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── STAFF TAB ── */}
          <TabsContent value="staff" className="p-6 space-y-5 mt-0">
            {/* Add staff row */}
            <div className="flex gap-3">
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="flex-1 rounded-xl bg-slate-50">
                  <SelectValue placeholder={
                    unassignedStaff.length === 0 ? 'No more staff to add' : 'Select staff member to add…'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {unassignedStaff.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">
                      {availableStaff.length === 0 ? 'No staff accounts found' : 'All staff already assigned'}
                    </div>
                  ) : (
                    unassignedStaff.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        {s.displayName}
                        <span className="ml-2 text-xs text-slate-400 capitalize">({s.role.replace('_', ' ')})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddStaff}
                disabled={isLoading || !selectedStaff}
                className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>

            {/* Assigned list */}
            <ScrollArea className="max-h-56">
              <div className="space-y-2">
                {assignedStaff.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No staff assigned yet</p>
                  </div>
                ) : (
                  assignedStaff.map((s) => (
                    <div key={s.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                          {s.displayName.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{s.displayName}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{s.role.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── CHILDREN TAB ── */}
          <TabsContent value="children" className="p-6 space-y-5 mt-0">
            <div className="flex gap-3">
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="flex-1 rounded-xl bg-slate-50">
                  <SelectValue placeholder={
                    childrenNotInClass.length === 0 ? 'All children already in this class' : 'Select child to assign…'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {childrenNotInClass.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-slate-400 text-center">No children available</div>
                  ) : (
                    childrenNotInClass.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                        {c.age ? <span className="ml-2 text-xs text-slate-400">(Age {c.age})</span> : null}
                        {c.class_id && c.class_id !== classId ? <span className="ml-1 text-xs text-amber-500"> ⚡ re-assign</span> : null}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignChild}
                disabled={isLoading || !selectedChild}
                className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Assign
              </Button>
            </div>

            <ScrollArea className="max-h-56">
              <div className="space-y-2">
                {(classChildren as any[]).length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Baby className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No children in this class yet</p>
                  </div>
                ) : (
                  (classChildren as any[]).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs uppercase">
                          {(c.first_name?.[0] ?? '')}{(c.last_name?.[0] ?? '')}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-slate-500">Age {c.age ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.allergies && (
                          <Badge variant="destructive" className="text-[10px]">Allergy</Badge>
                        )}
                        <button
                          onClick={() => handleRemoveChild(c.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="px-6 pb-5 flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => { onSuccess(); onOpenChange(false); }}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

