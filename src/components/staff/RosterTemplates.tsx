import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Clock, Users, Briefcase, Layout, Save, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClasses } from '@/hooks/useClasses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMinistries } from '@/hooks/useMinistries';
import { useVolunteers } from '@/hooks/useVolunteers';
import { useTranslation } from '@/lib/i18n';

const RosterTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { classes } = useClasses();
  const { ministries } = useMinistries();
  const { roles } = useVolunteers();
  const { t } = useTranslation();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['scheduling-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('scheduling_templates').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: requirements = [], isLoading: isLoadingReqs } = useQuery({
    queryKey: ['scheduling-requirements', selectedTemplateId],
    enabled: !!selectedTemplateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduling_requirement_items')
        .select(`
          *,
          classes:class_id(name),
          ministry:ministry_id(name),
          volunteer_role:volunteer_role_id(name),
          groups:required_group_id(name)
        `)
        .eq('template_id', selectedTemplateId)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    }
  });

  const { data: staffGroups = [] } = useQuery({
    queryKey: ['staff-groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_groups').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('scheduling_templates').insert([{ name }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-templates'] });
      setSelectedTemplateId(data.id);
      setIsAddTemplateOpen(false);
      setNewTemplateName('');
      toast({ title: "Blueprint Created", description: "Start adding shift requirements to your new template." });
    }
  });

  const addRequirementMutation = useMutation({
    mutationFn: async (req: any) => {
      const { data, error } = await supabase.from('scheduling_requirement_items').insert([req]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-requirements', selectedTemplateId] });
      toast({ title: "Requirement Added", description: "The roster blueprint has been updated." });
    }
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduling_requirement_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-requirements', selectedTemplateId] });
    }
  });

  const [newReq, setNewReq] = useState({
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '17:00:00',
    role_type: 'volunteer',
    class_id: '',
    ministry_id: '',
    volunteer_role_id: '',
    required_group_id: '',
    required_count: 1
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Roster Blueprints</h2>
          <p className="text-slate-500 font-medium">Define recurring staffing requirements for automated generation.</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="w-[240px] h-12 rounded-2xl bg-card shadow-sm border-slate-200">
              <SelectValue placeholder="Select Blueprint..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsAddTemplateOpen(true)}
            className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xl shadow-indigo-100"
          >
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      {isAddTemplateOpen && (
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50/50 p-8 border-2 border-dashed border-indigo-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="font-bold ml-1">Blueprint Name</Label>
              <Input 
                value={newTemplateName} 
                onChange={e => setNewTemplateName(e.target.value)} 
                placeholder="e.g., Summer Term Standard Roster" 
                className="h-12 rounded-xl bg-card border-none shadow-sm"
              />
            </div>
            <Button 
              onClick={() => { if(newTemplateName) createTemplateMutation.mutate(newTemplateName); }}
              disabled={createTemplateMutation.isPending}
              className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-8 font-bold uppercase text-[10px] tracking-widest text-white shadow-lg"
            >
              {createTemplateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Template"}
            </Button>
            <Button variant="ghost" onClick={() => setIsAddTemplateOpen(false)} className="h-12 rounded-xl font-bold">Cancel</Button>
          </div>
        </Card>
      )}

      {selectedTemplateId ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-card h-fit">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                Add Requirement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Day</Label>
                <Select value={String(newReq.day_of_week)} onValueChange={v => setNewReq({...newReq, day_of_week: parseInt(v)})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {days.map((day, i) => <SelectItem key={i} value={String(i)}>{day}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Start</Label>
                  <Input type="time" value={newReq.start_time.substring(0,5)} onChange={e => setNewReq({...newReq, start_time: e.target.value + ':00'})} className="h-11 rounded-xl bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">End</Label>
                  <Input type="time" value={newReq.end_time.substring(0,5)} onChange={e => setNewReq({...newReq, end_time: e.target.value + ':00'})} className="h-11 rounded-xl bg-slate-50 border-none shadow-inner" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role Identity</Label>
                <Select value={newReq.role_type} onValueChange={v => setNewReq({...newReq, role_type: v})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="leader">Leader / Teacher</SelectItem>
                    <SelectItem value="assistant">Assistant / TA</SelectItem>
                    <SelectItem value="admin">Administrative</SelectItem>
                    <SelectItem value="volunteer">Volunteer / Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Group Constraint</Label>
                <Select value={newReq.required_group_id} onValueChange={v => setNewReq({...newReq, required_group_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none"><SelectValue placeholder="Any Group" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none">Any Group (No Constraint)</SelectItem>
                    {staffGroups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Church Ministry</Label>
                <Select value={newReq.ministry_id} onValueChange={v => setNewReq({...newReq, ministry_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none"><SelectValue placeholder="General / No Ministry" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none">General (Any Ministry)</SelectItem>
                    {ministries?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spec. Volunteer Role</Label>
                <Select value={newReq.volunteer_role_id} onValueChange={v => setNewReq({...newReq, volunteer_role_id: v === 'none' ? '' : v})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none"><SelectValue placeholder="Any Specific Role" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none">Any Role (No Constraint)</SelectItem>
                    {roles?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Personnel count</Label>
                <Input type="number" min="1" value={newReq.required_count} onChange={e => setNewReq({...newReq, required_count: parseInt(e.target.value)})} className="h-11 rounded-xl bg-slate-50 border-none shadow-inner" />
              </div>

              <Button 
                onClick={() => addRequirementMutation.mutate({ 
                    ...newReq, 
                    template_id: selectedTemplateId, 
                    class_id: newReq.class_id || null, 
                    ministry_id: newReq.ministry_id || null, 
                    volunteer_role_id: newReq.volunteer_role_id || null, 
                    required_group_id: newReq.required_group_id || null 
                })}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-colors shadow-2xl shadow-indigo-100/50"
              >
                Insert Shift Block
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
             {isLoadingReqs ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
             ) : [0,1,2,3,4,5,6].map(dayIdx => {
               const dayReqs = requirements.filter((r: any) => r.day_of_week === dayIdx);
               if (dayReqs.length === 0) return null;
               return (
                 <div key={dayIdx} className="space-y-3">
                   <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 ml-4 mb-2 flex items-center gap-2">
                     <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                     {days[dayIdx]}
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {dayReqs.map((req: any) => (
                       <Card key={req.id} className="border-none shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] rounded-[2rem] bg-card group hover:shadow-indigo-100/50 transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 overflow-hidden">
                         <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                <Clock className="h-5 w-5 text-indigo-500" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-foreground">{req.start_time.substring(0,5)} - {req.end_time.substring(0,5)}</span>
                                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-wider">{req.required_count} UNITS</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {req.role_type}</span>
                                  {req.classes && <span className="flex items-center gap-1 text-indigo-400"><Layout className="w-3 h-3" /> {req.classes.name}</span>}
                                  {req.ministry && <span className="flex items-center gap-1 text-emerald-500 font-bold italic">{req.ministry.name}</span>}
                                  {req.volunteer_role && <span className="flex items-center gap-1 text-amber-500">• {req.volunteer_role.name}</span>}
                                  {req.groups && <span className="flex items-center gap-1 text-slate-400"><Building2 className="w-3 h-3" /> {req.groups.name}</span>}
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteRequirementMutation.mutate(req.id)}
                              className="opacity-0 group-hover:opacity-100 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all scale-90 group-hover:scale-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </div>
               );
             })}
             
             {requirements.length === 0 && (
               <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Layout className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground">Empty Blueprint</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">This template has no logic yet. Define your shift requirements on the left to activate auto-scheduling.</p>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-card rounded-[3rem] border-2 border-dashed border-slate-100">
           <Layout className="h-16 w-16 text-slate-100 mx-auto mb-4" />
           <h3 className="text-2xl font-bold text-foreground tracking-tight">Deployment Architecture</h3>
           <p className="text-slate-500 max-w-sm mx-auto mt-2">Select an existing roster blueprint or create a new one to begin designing your logistical infrastructure.</p>
        </div>
      )}
    </div>
  );
};

export default RosterTemplates;

