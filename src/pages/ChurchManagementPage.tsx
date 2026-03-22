import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  Users, ShieldCheck, Search, Plus, Loader2, ChevronRight, Activity, Zap, Layers, Sparkles, Trash2, Edit, UserPlus
} from 'lucide-react';
import { useMembers, ChurchMember, MembershipType, MembershipStatus } from '@/hooks/useMembers';
import { useMinistries, Ministry, useGroupMembers } from '@/hooks/useMinistries';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import MemberCRMDialog from '@/components/crm/MemberCRMDialog';
import JourneyKanbanBoard from '@/components/crm/JourneyKanbanBoard';
import DonationTracker from '@/components/crm/DonationTracker';
import { 
  BarChart3, 
  LayoutGrid, 
  CircleDollarSign, 
  ClipboardList,
  Sparkle
} from 'lucide-react';
import VisitorJourneyBoard from '@/components/crm/VisitorJourneyBoard';
import { Sparkles as SparklesIcon } from 'lucide-react';

const ChurchManagementPage = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { toast } = useToast();
    const { members, stats, isLoading: membersLoading, updateMember, createMember, createVisitor } = useMembers();
    const { ministries, isLoading: ministriesLoading, deleteMinistry, createMinistry, createGroup, assignMember } = useMinistries();
    
    const [activePerspective, setActivePerspective] = useState('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCRMOpen, setIsCRMOpen] = useState(false);
    const [crmMember, setCrmMember] = useState<ChurchMember | null>(null);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isAddMinistryOpen, setIsAddMinistryOpen] = useState(false);
    const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
    const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
    const [onboardingMode, setOnboardingMode] = useState<'existing' | 'new_guest'>('existing');
    const [onboardingMember, setOnboardingMember] = useState<{ profile_id: string; type: MembershipType; status: MembershipStatus }>({ profile_id: '', type: 'visitor', status: 'active' });
    const [newMinistry, setNewMinistry] = useState({ name: '', description: '', head_staff_id: '' });
    const [isAddVisitorOpen, setIsAddVisitorOpen] = useState(false);
    const [newVisitor, setNewVisitor] = useState({ firstName: '', lastName: '', email: '', phone: '', type: 'visitor' as MembershipType });
    const [newGroup, setNewGroup] = useState({ name: '', meetingDay: 'Sunday', meetingTime: '10:00' });
    const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedMembershipId, setSelectedMembershipId] = useState<string>('');

    const filteredMembers = members.filter(m => {
        const name = `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        updateMember({
            id: selectedMember.id,
            membership_type: selectedMember.membership_type,
            status: selectedMember.status,
            profile_id: selectedMember.profiles?.id
        }, { onSuccess: () => setIsEditDialogOpen(false) });
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onboardingMember.profile_id) return;
        createMember({
            profile_id: onboardingMember.profile_id,
            membership_type: onboardingMember.type,
            status: onboardingMember.status,
            joined_at: new Date().toISOString()
        }, { onSuccess: () => setIsAddMemberOpen(false) });
    };

    return (
        <UnifiedDashboardLayout>
          <TooltipProvider>
            <div className="space-y-8 pb-20 p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{t('churchManagement')}</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Tabs value={activePerspective} onValueChange={setActivePerspective} className="w-fit">
                            <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border-none h-14">
                                <TabsTrigger value="members" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <Users className="h-4 w-4 mr-2" /> {t('members')}
                                </TabsTrigger>
                                <TabsTrigger value="ministries" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <LayoutGrid className="h-4 w-4 mr-2" /> {t('ministries')}
                                </TabsTrigger>
                                <TabsTrigger value="visitor_crm" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <SparklesIcon className="h-4 w-4 mr-2" /> Visitor CRM
                                </TabsTrigger>
                                <TabsTrigger value="kanban" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <ClipboardList className="h-4 w-4 mr-2" /> {t('kanban')}
                                </TabsTrigger>
                                <TabsTrigger value="journey" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <BarChart3 className="h-4 w-4 mr-2" /> {t('analysis')}
                                </TabsTrigger>
                                <TabsTrigger value="giving" className="rounded-xl px-6 font-bold h-11 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                                    <CircleDollarSign className="h-4 w-4 mr-2" /> {t('giving')}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button onClick={() => setIsAddMemberOpen(true)} className="h-12 px-6 rounded-xl bg-indigo-600 font-bold text-white shadow-sm">
                            <Plus className="h-5 w-5 mr-2" /> ADD
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activePerspective === 'members' && (
                        <motion.div key="members" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input placeholder="Search congregation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 font-bold" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {membersLoading ? (
                                    <div className="col-span-full py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600" /></div>
                                ) : filteredMembers.map(member => (
                                    <Card key={member.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm transition-all group overflow-hidden hover:shadow-md">
                                         <div className="flex gap-6">
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                {member.profiles?.first_name?.[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3 py-1 uppercase text-[10px] tracking-widest">{member.membership_type}</Badge>
                                                    {member.status !== 'active' && <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">{member.status}</Badge>}
                                                </div>
                                                <h4 className="text-2xl font-black text-slate-900 dark:text-white truncate">{member.profiles?.first_name} {member.profiles?.last_name}</h4>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">{member.profiles?.email}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-indigo-600 rounded-full" onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                <Button size="sm" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase tracking-widest px-3 h-8 rounded-lg transition-all" onClick={() => { setCrmMember(member); setIsCRMOpen(true); }}>PROFILE <ChevronRight className="h-3 w-3 inline ml-1 opacity-50" /></Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activePerspective === 'ministries' && (
                        <motion.div key="ministries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {ministriesLoading ? (
                                    <div className="col-span-full py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600" /></div>
                                ) : ministries.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed text-slate-400">
                                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No departments or groups found</p>
                                        <Button variant="link" className="text-indigo-600 font-bold mt-2" onClick={() => setIsAddMinistryOpen(true)}>Initialize First Ministry</Button>
                                    </div>
                                ) : ministries.map(ministry => (
                                    <div key={ministry.id} className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <Layers className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{ministry.name}</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="border-indigo-100 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors h-8" onClick={() => { setSelectedMinistryId(ministry.id); setIsAddGroupOpen(true); }}>
                                                <Plus className="h-3.5 w-3.5 mr-1" /> GROUP
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {ministry.groups?.map(group => (
                                                <Card key={group.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900/40 border-none shadow-[0_4px_12px_rgba(0,0,0,0.03)] group hover:shadow-lg transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">{group.name}</h4>
                                                            <div className="flex items-center gap-2">
                                                                <Activity className="h-3 w-3 text-indigo-500" />
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                    {group.meeting_day} • {group.meeting_time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <Badge className="bg-indigo-600/10 text-indigo-600 border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full cursor-help hover:bg-indigo-600 hover:text-white transition-all">{group.member_count || 0} Members</Badge>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0" onClick={() => { setSelectedGroupId(group.id); setIsAssignMemberOpen(true); }}><UserPlus className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                            {(!ministry.groups || ministry.groups.length === 0) && (
                                                <div className="p-10 border border-dashed rounded-2xl text-center text-slate-300 text-xs font-bold uppercase tracking-widest">No active groups</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activePerspective === 'journey' && (
                        <motion.div key="journey" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-8 rounded-3xl bg-indigo-600 text-white border-none shadow-xl flex flex-col justify-between overflow-hidden relative">
                                    <Zap className="absolute -right-4 -top-4 w-32 h-32 opacity-10 rotate-12" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Retention Phase</p>
                                        <h3 className="text-3xl font-black">New Guests</h3>
                                    </div>
                                    <div className="mt-8 flex items-end justify-between">
                                        <span className="text-5xl font-black">{stats?.visitor_count || 0}</span>
                                        <Badge className="bg-white/20 text-white border-none font-bold px-3 py-1">+12% this month</Badge>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pastoral Care</p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">Active Journey</h3>
                                    </div>
                                    <div className="mt-8 flex items-end justify-between">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white">{stats?.active_journey || 0}</span>
                                        <Badge variant="outline" className="font-bold border-slate-200 px-3 py-1 rounded-lg">Needs Contact</Badge>
                                    </div>
                                </Card>

                                <Card className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Retention</p>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">Integrations</h3>
                                    </div>
                                    <div className="mt-8 flex items-end justify-between">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white">{stats?.integrations_perc || 0}%</span>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold px-3 py-1 rounded-lg">Excellent</Badge>
                                    </div>
                                </Card>
                            </div>

                            <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-10 mt-12">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                        <Activity className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Acquisition Funnel</h3>
                                </div>
                                <div className="space-y-8">
                                    {[
                                        { stage: 'Initial Visit', count: stats?.visitor_count || 0, color: 'bg-indigo-600' },
                                        { stage: 'First Follow-up', count: stats?.first_followup || 0, color: 'bg-indigo-500' },
                                        { stage: 'Regular Attendance', count: stats?.regular_count || 0, color: 'bg-indigo-400' },
                                        { stage: 'Official Membership', count: stats?.registered_count || 0, color: 'bg-indigo-300' }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-6">
                                            <div className="w-40 text-left">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{step.stage}</p>
                                            </div>
                                            <div className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${(step.count / Math.max(stats?.visitor_count || 1, 1)) * 100}%` }}
                                                    className={`h-full ${step.color} shadow-lg`}
                                                />
                                            </div>
                                            <div className="w-16">
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{step.count}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activePerspective === 'visitor_crm' && (
                        <motion.div key="visitor_crm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <VisitorJourneyBoard />
                        </motion.div>
                    )}

                    {activePerspective === 'kanban' && (
                        <motion.div key="kanban" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <JourneyKanbanBoard />
                        </motion.div>
                    )}

                    {activePerspective === 'giving' && (
                        <motion.div key="giving" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <DonationTracker />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MemberCRMDialog 
                member={crmMember} 
                isOpen={isCRMOpen} 
                onOpenChange={setIsCRMOpen} 
            />

            <Dialog open={isAddMinistryOpen} onOpenChange={setIsAddMinistryOpen}>
                 <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">New Department</DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium">Create a new ministry area to organize your teams.</DialogDescription>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMinistry.name) return;
                        createMinistry({ name: newMinistry.name }, {
                            onSuccess: () => {
                                setIsAddMinistryOpen(false);
                                setNewMinistry({ name: '', description: '', head_staff_id: '' });
                            }
                        });
                    }} className="p-8 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Department Name</Label>
                            <Input placeholder="e.g. Media & Production" value={newMinistry.name} onChange={e => setNewMinistry({...newMinistry, name: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                        </div>
                        <Button type="submit" className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold shadow-sm">CREATE MINISTRY</Button>
                    </form>
                 </DialogContent>
            </Dialog>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                 <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Onboard New Face</DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium">Add a new guest or register a formal member.</DialogDescription>
                    </div>
                    <div className="p-8 space-y-4">
                        <Button className="w-full h-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-transparent hover:border-indigo-600 transition-all flex items-center justify-start gap-5 p-6 shadow-none group" onClick={() => { setIsAddMemberOpen(false); setIsAddVisitorOpen(true); }}>
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><Zap className="h-6 w-6 text-orange-600" /></div>
                            <div className="text-left">
                                <p className="font-black text-xl tracking-tight uppercase">New Visitor</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] opacity-60">Start Journey</p>
                            </div>
                        </Button>
                        <Button className="w-full h-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-transparent hover:border-indigo-600 transition-all flex items-center justify-start gap-5 p-6 shadow-none group" onClick={() => { setIsAddMemberOpen(false); setIsAddMinistryOpen(true); }}>
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><Layers className="h-6 w-6 text-indigo-600" /></div>
                            <div className="text-left">
                                <p className="font-black text-xl tracking-tight uppercase">New Department</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] opacity-60">Organize Ministry</p>
                            </div>
                        </Button>
                    </div>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddVisitorOpen} onOpenChange={setIsAddVisitorOpen}>
                 <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-orange-500 p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Onboard Guest</DialogTitle>
                        <DialogDescription className="text-orange-50 font-medium">Add a new guest to the database and start tracking their journey.</DialogDescription>
                    </div>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newVisitor.firstName || !newVisitor.lastName) return;
                        createVisitor({
                            first_name: newVisitor.firstName,
                            last_name: newVisitor.lastName,
                            email: newVisitor.email,
                            phone: newVisitor.phone,
                            type: newVisitor.type
                        }, { onSuccess: () => setIsAddVisitorOpen(false) });
                    }} className="p-8 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">First Name</Label>
                                <Input placeholder="John" value={newVisitor.firstName} onChange={e => setNewVisitor({...newVisitor, firstName: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Last Name</Label>
                                <Input placeholder="Doe" value={newVisitor.lastName} onChange={e => setNewVisitor({...newVisitor, lastName: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Email</Label>
                            <Input placeholder="john@example.com" type="email" value={newVisitor.email} onChange={e => setNewVisitor({...newVisitor, email: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Phone</Label>
                            <Input placeholder="(555) 000-0000" value={newVisitor.phone} onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" />
                        </div>
                        <Button type="submit" className="w-full h-14 bg-orange-500 text-white rounded-[1.5rem] font-black tracking-widest shadow-lg shadow-orange-100 mt-4 active:scale-95 transition-all">START JOURNEY</Button>
                    </form>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                 <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">New Small Group</DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium tracking-tight">Create a new group within this department.</DialogDescription>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newGroup.name || !selectedMinistryId) return;
                        createGroup({
                            ministry_id: selectedMinistryId,
                            name: newGroup.name,
                            meeting_day: newGroup.meetingDay,
                            meeting_time: newGroup.meetingTime + ':00'
                        }, { onSuccess: () => {
                            setIsAddGroupOpen(false);
                            setNewGroup({ name: '', meetingDay: 'Sunday', meetingTime: '10:00' });
                        }});
                    }} className="p-8 space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Group Name</Label>
                            <Input placeholder="e.g. Mid-week Fellowship" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Meeting Day</Label>
                                <Select value={newGroup.meetingDay} onValueChange={val => setNewGroup({...newGroup, meetingDay: val})}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <SelectItem key={d} value={d} className="font-bold">{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Meeting Time</Label>
                                <Input type="time" value={newGroup.meetingTime} onChange={e => setNewGroup({...newGroup, meetingTime: e.target.value})} className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold" required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-widest shadow-lg shadow-indigo-100 mt-4 active:scale-95 transition-all">ESTABLISH GROUP</Button>
                    </form>
                 </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-[#F8F9FA] dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white"><DialogTitle className="text-xl font-bold uppercase tracking-tight">Refine Membership</DialogTitle></div>
                    {selectedMember && (
                        <form onSubmit={handleUpdate} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Engagement Type</Label>
                                    <Select value={selectedMember.membership_type} onValueChange={val => setSelectedMember({...selectedMember, membership_type: val as MembershipType})}>
                                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold shadow-inner"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            <SelectItem value="visitor" className="font-bold">Visitor / Guest</SelectItem>
                                            <SelectItem value="regular" className="font-bold">Regular Attendee</SelectItem>
                                            <SelectItem value="registered" className="font-bold">Registered Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold px-6 shadow-sm">SYNC CHANGES</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignMemberOpen} onOpenChange={setIsAssignMemberOpen}>
                 <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Assign Member</DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium tracking-tight">Add an individual from the congregation into this small group to accurately measure engagement.</DialogDescription>
                    </div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!selectedGroupId || !selectedMembershipId) return;
                        assignMember({ membershipId: selectedMembershipId, groupId: selectedGroupId, role: 'member' }, { 
                            onSuccess: () => {
                                setIsAssignMemberOpen(false);
                                setSelectedMembershipId('');
                            }
                        });
                    }} className="p-8 space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Select Member</Label>
                            <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold"><SelectValue placeholder="Search members..." /></SelectTrigger>
                                <SelectContent className="max-h-64 rounded-xl border-none shadow-2xl">
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">
                                            {m.profiles?.first_name} {m.profiles?.last_name} - {m.membership_type.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-[1.5rem] font-black tracking-widest shadow-lg shadow-indigo-100 mt-4 active:scale-95 transition-all">CONFIRM ASSIGNMENT</Button>
                    </form>
                 </DialogContent>
            </Dialog>
          </TooltipProvider>
        </UnifiedDashboardLayout>
    );
};

export default ChurchManagementPage;
