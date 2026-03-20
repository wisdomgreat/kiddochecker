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
  Users, ShieldCheck, Search, Plus, Loader2, ChevronRight, Activity, Zap, Layers, Sparkles, Trash2, Edit
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

const ChurchManagementPage = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { toast } = useToast();
    const { members, stats, isLoading: membersLoading, updateMember, createMember, createVisitor } = useMembers();
    const { ministries, isLoading: ministriesLoading, deleteMinistry } = useMinistries();
    
    const [activePerspective, setActivePerspective] = useState('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isCRMOpen, setIsCRMOpen] = useState(false);
    const [crmMember, setCrmMember] = useState<ChurchMember | null>(null);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [onboardingMode, setOnboardingMode] = useState<'existing' | 'new_guest'>('existing');
    const [onboardingMember, setOnboardingMember] = useState<{ profile_id: string; type: MembershipType; status: MembershipStatus }>({ profile_id: '', type: 'visitor', status: 'active' });

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
            pastoral_notes: selectedMember.pastoral_notes,
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
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-100 shadow-xl">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('churchManagement')}</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Tabs value={activePerspective} onValueChange={setActivePerspective} className="w-fit">
                            <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border-none h-12">
                                <TabsTrigger value="members" className="rounded-xl px-6 font-bold">{t('members')}</TabsTrigger>
                                <TabsTrigger value="ministries" className="rounded-xl px-6 font-bold">{t('ministries')}</TabsTrigger>
                                <TabsTrigger value="journey" className="rounded-xl px-6 font-bold">{t('guestJourney')}</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button onClick={() => setIsAddMemberOpen(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                            <Plus className="h-5 w-5 mr-2" /> ADD
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activePerspective === 'members' && (
                        <motion.div key="members" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input placeholder="Search congregation..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {membersLoading ? (
                                    <div className="col-span-full py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600" /></div>
                                ) : filteredMembers.map(member => (
                                    <Card key={member.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/40 border dark:border-white/5 shadow-xl shadow-slate-100 dark:shadow-none transition-all group overflow-hidden">
                                         <div className="flex gap-6">
                                            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                {member.profiles?.first_name?.[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3 py-1">{member.membership_type}</Badge>
                                                </div>
                                                <h4 className="text-2xl font-black text-slate-900 dark:text-white truncate">{member.profiles?.first_name} {member.profiles?.last_name}</h4>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">{member.profiles?.email}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-indigo-600" onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="text-indigo-600 font-black text-[10px] uppercase tracking-widest p-0 h-6" onClick={() => { setCrmMember(member); setIsCRMOpen(true); }}>JOURNEY <ChevronRight className="h-3 w-3 inline" /></Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MemberCRMDialog 
                member={crmMember} 
                isOpen={isCRMOpen} 
                onOpenChange={setIsCRMOpen} 
            />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
                    <div className="bg-indigo-600 p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight italic">Refine Membership</DialogTitle></div>
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
                            <Button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-3xl font-black">SYNC CHANGES</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
          </TooltipProvider>
        </UnifiedDashboardLayout>
    );
};

export default ChurchManagementPage;
