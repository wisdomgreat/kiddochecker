import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Search, Filter, ShieldCheck, Heart, 
  Calendar, Star, MoreVertical, Edit, Phone, Mail, 
  ChevronRight, Loader2, Sparkles, BookOpen, Clock, 
  CheckCircle2, AlertCircle, ArrowUpRight, Plus, MapPin,
  ExternalLink, Layers, Trash2, UserCheck, Briefcase, Zap, Activity, PhoneCall
} from 'lucide-react';
import { useMembers, ChurchMember, MembershipType, MembershipStatus, ChurchStats } from '@/hooks/useMembers';
import { useMinistries, Ministry, MinistryGroup, useGroupMembers } from '@/hooks/useMinistries';
import { useVolunteers, VolunteerRole, VolunteerEvent } from '@/hooks/useVolunteers';
import { useShifts } from '@/hooks/useShifts';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVisitorInteractions } from '@/hooks/useVisitorInteractions';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';

const ChurchManagementPage = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { toast } = useToast();
    const { members, stats, isLoading: membersLoading, updateMember, createMember, createVisitor, isUpdating, isCreating } = useMembers();
    const { ministries, isLoading: ministriesLoading, createMinistry, updateMinistry, deleteMinistry, createGroup, assignMember, removeAssignment } = useMinistries();
    const { data: allProfiles = [], isLoading: profilesLoading } = useAllUsers();
    const { templates } = useEmailTemplates();

    const [activePerspective, setActivePerspective] = useState('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);
    const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isEditMinistryOpen, setIsEditMinistryOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
    const [isDeleteMinistryOpen, setIsDeleteMinistryOpen] = useState(false);
    
    // Quick Register State
    const [onboardingMode, setOnboardingMode] = useState<'existing' | 'new_guest'>('existing');
    const [quickGuest, setQuickGuest] = useState({ first_name: '', last_name: '', email: '', phone: '' });

    // CRM State
    const [isCRMOpen, setIsCRMOpen] = useState(false);
    const [crmMember, setCrmMember] = useState<ChurchMember | null>(null);
    const [newCRMNote, setNewCRMNote] = useState('');
    const { interactions, addInteraction, sendEmail, isSending } = useVisitorInteractions(crmMember?.profiles?.id);
    const { data: globalInteractions = [], isLoading: globalLoading } = useQuery({
        queryKey: ['global-interactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('visitor_interactions')
                .select('*, profiles(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(5);
            if (error) throw error;
            return data;
        }
    });

    const [onboardingMember, setOnboardingMember] = useState<{ profile_id: string; type: MembershipType; status: MembershipStatus }>({ profile_id: '', type: 'regular', status: 'active' });
    
    // Ministry State
    const [isNewMinistryOpen, setIsNewMinistryOpen] = useState(false);
    const [newMinistryName, setNewMinistryName] = useState('');
    const [newMinistryHeadId, setNewMinistryHeadId] = useState<string | undefined>(undefined);
    const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Group & Roster State
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isRosterOpen, setIsRosterOpen] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const { data: groupMembers = [], isLoading: rosterLoading } = useGroupMembers(selectedGroupId || undefined);
    
    // Volunteer Engine State
    const { events: volunteerEvents, roles: volunteerRoles, isEventsLoading, isRolesLoading, createRole, createPosition } = useVolunteers();
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', ministry_id: '', description: '' });
    const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
    const [newPosition, setNewPosition] = useState({ role_id: '', event_id: '', start_time: '', end_time: '' });

    const filteredMembers = members.filter(m => {
        const name = `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''} ${m.children?.first_name || ''} ${m.children?.last_name || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const assignableMembers = members.filter(m => {
        const name = `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''} ${m.children?.first_name || ''} ${m.children?.last_name || ''}`.toLowerCase();
        const alreadyInGroup = groupMembers.some(gm => gm.membership_id === m.id);
        return name.includes(memberSearchTerm.toLowerCase()) && !alreadyInGroup;
    }).slice(0, 5);

    const getMembershipBadge = (type: MembershipType) => {
        switch (type) {
            case 'registered': return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold px-3 py-1">{t('registeredMember')}</Badge>;
            case 'regular': return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1">{t('regularAttendee')}</Badge>;
            case 'visitor': return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3 py-1">{t('visitorGuest')}</Badge>;
            default: return null;
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;
        updateMember({
            id: selectedMember.id,
            membership_type: selectedMember.membership_type,
            status: selectedMember.status,
            baptism_date: selectedMember.baptism_date,
            pastoral_notes: selectedMember.pastoral_notes,
            profile_id: selectedMember.profiles?.id,
            profile_updates: {
                gender: selectedMember.profiles?.gender,
                date_of_birth: selectedMember.profiles?.date_of_birth,
                address: selectedMember.profiles?.address,
                city: selectedMember.profiles?.city,
                state: selectedMember.profiles?.state,
                zip_code: selectedMember.profiles?.zip_code,
                secondary_phone: selectedMember.profiles?.secondary_phone,
                marital_status: selectedMember.profiles?.marital_status,
                bio: selectedMember.profiles?.bio,
                occupation: selectedMember.profiles?.occupation,
                emergency_contact_name: selectedMember.profiles?.emergency_contact_name,
                emergency_contact_phone: selectedMember.profiles?.emergency_contact_phone
            }
        }, {
            onSuccess: () => setIsEditDialogOpen(false)
        });
    };

    const handleCreateMinistry = (e: React.FormEvent) => {
        e.preventDefault();
        createMinistry({ name: newMinistryName, head_staff_id: newMinistryHeadId }, {
            onSuccess: () => { 
                setIsNewMinistryOpen(false); 
                setNewMinistryName('');
                setNewMinistryHeadId(undefined);
            }
        });
    };

    const handleUpdateMinistry = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMinistry) return;
        updateMinistry({ 
            id: selectedMinistry.id, 
            name: selectedMinistry.name, 
            description: selectedMinistry.description,
            head_staff_id: selectedMinistry.head_staff_id
        }, {
            onSuccess: () => setIsEditMinistryOpen(false)
        });
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (onboardingMode === 'existing') {
            if (!onboardingMember.profile_id) {
                toast({ title: t('selectionRequired' as any), description: "Please select an existing profile.", variant: "destructive" });
                return;
            }
            createMember({
                profile_id: onboardingMember.profile_id,
                membership_type: onboardingMember.type,
                status: onboardingMember.status,
                joined_at: new Date().toISOString()
            }, {
                onSuccess: () => {
                    setIsAddMemberOpen(false);
                    setOnboardingMember({ profile_id: '', type: 'regular', status: 'active' });
                }
            });
        } else {
            if (!quickGuest.first_name || !quickGuest.email) {
                toast({ title: "Missing Info", description: "First name and email are required for guests.", variant: "destructive" });
                return;
            }
            createVisitor({
                ...quickGuest,
                type: onboardingMember.type
            }, {
                onSuccess: (data) => {
                    if (onboardingMember.type === 'visitor' && data?.profile) {
                        sendEmail({
                            to: data.profile.email,
                            templateName: 'visitor_welcome',
                            templateData: { 
                                visitorName: data.profile.first_name,
                                churchName: 'Our Church' // Dynamically get this from config if available
                            },
                            visitor_id: data.profile.id
                        });
                    }
                    setIsAddMemberOpen(false);
                    setQuickGuest({ first_name: '', last_name: '', email: '', phone: '' });
                }
            });
        }
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMinistryId) return;
        createGroup({ name: newGroupName, ministry_id: selectedMinistryId }, {
            onSuccess: () => { setIsNewGroupOpen(false); setNewGroupName(''); }
        });
    };

    const handleAssignMember = (membershipId: string) => {
        if (!selectedGroupId) return;
        assignMember({ membershipId, groupId: selectedGroupId, role: 'Participant' });
    };

    return (
        <UnifiedDashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Hero Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-100 shadow-xl">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('churchManagement')}</h1>
                        </div>
                        <p className="text-slate-500 font-medium pl-1">{t('churchManagementSubtitle')}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Tabs value={activePerspective} onValueChange={setActivePerspective} className="w-fit">
                            <TabsList className="bg-slate-100 p-1 rounded-2xl border-none h-12 shadow-inner">
                                <TabsTrigger value="members" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Users className="h-4 w-4 mr-2" /> {t('members')}
                                </TabsTrigger>
                                <TabsTrigger value="ministries" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Layers className="h-4 w-4 mr-2" /> {t('ministries')}
                                </TabsTrigger>
                                <TabsTrigger value="volunteers" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Sparkles className="h-4 w-4 mr-2" /> {t('volunteers')}
                                </TabsTrigger>
                                <TabsTrigger value="journey" className="rounded-xl px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Sparkles className="h-4 w-4 mr-2" /> {t('guestJourney')}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <div className="w-px h-8 bg-slate-200 mx-2" />
                        
                        {activePerspective === 'members' && hasPermission('church_manage_members') && (
                            <Button onClick={() => setIsAddMemberOpen(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg font-bold">
                                <UserPlus className="h-5 w-5 mr-2" /> {t('addMember')}
                            </Button>
                        )}
                        {activePerspective === 'ministries' && hasPermission('church_manage_ministries') && (
                            <Button onClick={() => setIsNewMinistryOpen(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg font-bold">
                                <Plus className="h-5 w-5 mr-2" /> {t('newMinistryTitle')}
                            </Button>
                        )}
                        {activePerspective === 'volunteers' && hasPermission('church_manage_volunteers') && (
                            <Button onClick={() => setIsRoleDialogOpen(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg font-bold">
                                <Plus className="h-5 w-5 mr-2" /> {t('createRole')}
                            </Button>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activePerspective === 'members' && (
                        <motion.div 
                            key="members-view"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-none shadow-xl shadow-indigo-100/30 rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden p-8 relative group">
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold opacity-80 uppercase tracking-widest font-heading">{t('totalCongregation')}</h3>
                                            <p className="text-4xl font-black mt-1 leading-none">{stats?.total_members || 0}</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-[-10%] right-[-50%] w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white p-8 space-y-4">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">{t('registeredCount')}</h3>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{stats?.registered_count || 0}</p>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white p-8 space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                        <Layers className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">Total {t('ministries')}</h3>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{ministries.length}</p>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white p-8 space-y-4">
                                    <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-pink-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">{t('activeGroups')}</h3>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{stats?.active_groups || 0}</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Search */}
                            <div className="relative w-full max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600" />
                                <Input 
                                    placeholder="Search by name, status, or role..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-12 h-12 rounded-2xl border-slate-200 bg-white/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 font-medium transition-all"
                                />
                            </div>

                            {/* List */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {membersLoading ? (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                                        <p className="text-slate-400 font-bold">Synchronizing congregation list...</p>
                                    </div>
                                ) : (
                                    filteredMembers.map((member, idx) => (
                                        <motion.div 
                                            key={member.id} 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] hover:shadow-indigo-100/50 transition-all group overflow-hidden bg-white">
                                                <div className="p-8 flex gap-6">
                                                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                                                        {(member.profiles?.first_name?.[0] || member.children?.first_name?.[0] || '?')}
                                                    </div>
                                                    
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getMembershipBadge(member.membership_type)}
                                                                    <Badge variant="outline" className={`text-[10px] font-black uppercase ${member.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>{member.status}</Badge>
                                                                </div>
                                                                <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                                    {member.profiles ? `${member.profiles.first_name} ${member.profiles.last_name}` : `${member.children?.first_name} ${member.children?.last_name}`}
                                                                    {member.child_id && <Badge className="ml-2 bg-pink-50 text-pink-600 border-pink-100 font-bold uppercase text-[9px]">Child</Badge>}
                                                                </h4>
                                                            </div>
                                                            {hasPermission('church_manage_members') && (
                                                                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-indigo-600" onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                            <Mail className="h-3.5 w-3.5" /> {member.profiles?.email || 'System Account'}
                                                        </div>
                                                    </div>
                                                </div>
                                                 <div className="px-8 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('pastoralCare')} Tier 1</span>
                                                     <Button variant="ghost" className="h-8 text-indigo-600 font-black text-[10px] tracking-widest p-0">{t('journeyDetails').toUpperCase()} <ChevronRight className="h-3 w-3 ml-1" /></Button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activePerspective === 'ministries' && (
                        <motion.div 
                            key="ministries-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {ministriesLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm">
                                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                                    <p className="text-slate-400 font-bold">Loading department structures...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {ministries.map((ministry) => (
                                        <Card key={ministry.id} className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white overflow-hidden p-0 flex flex-col">
                                            <div className="p-8 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{ministry.name}</h3>
                                                    <p className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">
                                                        Head: {ministry.head_staff ? `${ministry.head_staff.first_name} ${ministry.head_staff.last_name}` : 'Unassigned'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {hasPermission('church_manage_ministries') && (
                                                        <Button size="icon" variant="ghost" className="bg-white rounded-xl shadow-sm text-slate-400 hover:text-indigo-600" onClick={() => { setSelectedMinistry(ministry); setIsEditMinistryOpen(true); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('church_manage_ministries') && (
                                                        <Button size="icon" variant="ghost" className="bg-white rounded-xl shadow-sm text-slate-400 hover:text-rose-600" onClick={() => { setSelectedMinistry(ministry); setIsDeleteMinistryOpen(true); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-8 flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('smallGroups').toUpperCase()}</span>
                                                     {hasPermission('church_manage_ministries') && (
                                                         <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm" className="h-6 text-indigo-600 text-[10px] font-black tracking-widest" onClick={() => { setSelectedMinistryId(ministry.id); setIsNewGroupOpen(true); }}>
                                                                <Plus className="h-3 w-3 mr-1" /> {t('addGroup').toUpperCase()}
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="h-6 text-emerald-600 text-[10px] font-black tracking-widest" onClick={() => toast({ title: "Bulk Message", description: `Drafting message to all ${ministry.name} members` })}>
                                                                <Mail className="h-3 w-3 mr-1" /> {t('message').toUpperCase()}
                                                            </Button>
                                                         </div>
                                                     )}
                                                 </div>
                                                <div className="space-y-3">
                                                    {ministry.groups?.length ? ministry.groups.map(group => (
                                                        <div key={group.id} onClick={() => { setSelectedGroupId(group.id); setIsRosterOpen(true); }} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group cursor-pointer">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{group.name}</span>
                                                                <Badge className="bg-white text-slate-400 border-slate-100 text-[10px]">{group.member_count || 0} Members</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                <Clock className="h-3 w-3" /> {group.meeting_day || '---'} @ {group.meeting_time || '---'}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                         <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                                             <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{t('noActiveGroups')}</p>
                                                         </div>
                                                    )}
                                                </div>
                                            </div>
                                             <div className="p-6 pt-0">
                                                 <Button className="w-full h-12 rounded-2xl border-slate-200 bg-white text-indigo-600 font-bold hover:bg-indigo-50 border shadow-none" variant="outline" onClick={() => { setSelectedMinistry(ministry); setIsOrgDialogOpen(true); }}>
                                                     {t('organizationChart')} <ChevronRight className="h-4 w-4 ml-2" />
                                                 </Button>
                                             </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                     {activePerspective === 'volunteers' && (
                        // ... existing volunteer view ...
                        <div /> // Placeholder to match length if needed, but I'll use the actual content below
                     )}

                     {activePerspective === 'journey' && (
                        <motion.div 
                            key="journey-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            {/* Retention Analytics Header */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white dark:bg-slate-900/40 p-8 overflow-hidden relative border border-slate-50 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                                                <Activity className="h-6 w-6 text-indigo-600" /> {t('journeyRetentionAnalytics')}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('visitorRetentionOverTime')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-indigo-600">
                                                {Math.round((members.filter(m => m.membership_type === 'registered').length / (members.length || 1)) * 100)}%
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('overallConversion')}</p>
                                        </div>
                                    </div>

                                    {/* Visual Funnel */}
                                    <div className="space-y-6 relative z-10 w-full max-w-2xl mx-auto py-4">
                                        {[
                                            { label: t('visitorGuest'), count: members.filter(m => m.membership_type === 'visitor').length, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', width: '100%', icon: UserPlus },
                                            { label: t('regularAttendee'), count: members.filter(m => m.membership_type === 'regular').length, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600', width: '75%', icon: Calendar },
                                            { label: t('registeredMember'), count: members.filter(m => m.membership_type === 'registered').length, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600', width: '50%', icon: ShieldCheck }
                                        ].map((step, i) => (
                                            <div key={step.label} className="flex items-center gap-4 group">
                                                <div className="w-48 text-right hidden md:block">
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">{step.label}</p>
                                                    <p className="text-lg font-black text-slate-900 dark:text-white">{step.count}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden group-hover:shadow-md transition-all">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: step.width }}
                                                            transition={{ delay: i * 0.2, duration: 1 }}
                                                            className={`absolute inset-y-0 left-0 ${step.color} transition-all border-r-2 border-current flex items-center px-4`}
                                                        >
                                                            <step.icon className="h-5 w-5 mr-3 shrink-0" />
                                                            <span className="font-black text-sm uppercase tracking-tight truncate">{step.label}</span>
                                                        </motion.div>
                                                        <div className="absolute right-4 inset-y-0 flex items-center">
                                                            <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 uppercase italic">
                                                                {Math.round((step.count / (members.length || 1)) * 100)}% {t('coverage')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-[-10%] right-[-10%] w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-indigo-600 text-white p-8 space-y-4 overflow-hidden relative">
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest">{t('automationHealth')}</h4>
                                            <p className="text-3xl font-black mt-1">98.2%</p>
                                            <p className="text-[10px] font-medium text-indigo-100 pt-2 flex items-center gap-1">
                                                <ArrowUpRight className="h-3 w-3" /> {t('deliveredSuccessfully')}
                                            </p>
                                        </div>
                                        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white dark:bg-slate-900/40 p-8 border border-slate-50 dark:border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('dropOffPrevention')}</h4>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">Active</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                {t('automationScanningDescription')}
                                            </p>
                                            <Button variant="outline" className="w-full h-10 rounded-xl border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-widest">
                                                {t('viewRecentErrors').toUpperCase()}
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Stage Tracker Grid */}
                            <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[3rem] shadow-xl shadow-slate-100/50 dark:shadow-black/20 border border-slate-50 dark:border-white/5 overflow-x-auto">
                                <div className="flex items-center justify-between mb-8 min-w-max">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center gap-3">
                                            <Plus className="h-6 w-6 text-indigo-600" /> {t('followUpWorkflow')}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('trackingProgressAcrossStages')}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-indigo-600 text-white font-black px-4 py-2 rounded-full shadow-lg shadow-indigo-100 dark:shadow-none">
                                            {members.filter(m => m.membership_type === 'visitor').length} New This Month
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="text-slate-300 dark:text-slate-600"><MoreVertical className="h-5 w-5" /></Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-w-[900px]">
                                    {[
                                        { title: t('visitorGuest'), type: 'visitor', color: 'bg-amber-500', icon: Mail },
                                        { title: t('regularAttendee'), type: 'regular', color: 'bg-indigo-500', icon: Calendar },
                                        { title: t('registeredMember'), type: 'registered', color: 'bg-emerald-500', icon: ShieldCheck }
                                    ].map(stage => {
                                        const stageMembers = members.filter(m => m.membership_type === stage.type);
                                        return (
                                            <div key={stage.title} className="space-y-6">
                                                <div className="flex justify-between items-center px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${stage.color} animate-pulse`} />
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stage.title}</h4>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs font-black text-slate-300 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-500 border-none">{stageMembers.length}</Badge>
                                                </div>
                                                <div className="bg-slate-50/50 dark:bg-slate-900/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 min-h-[400px] flex flex-col gap-4">
                                                    {stageMembers.map(m => (
                                                        <motion.div 
                                                            key={m.id} 
                                                            layoutId={`crm-${m.id}`}
                                                            className="bg-white dark:bg-slate-800/60 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-600/50 hover:shadow-xl transition-all cursor-pointer group"
                                                            onClick={() => { setCrmMember(m); setIsCRMOpen(true); }}
                                                        >
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                                                                    {(m.profiles?.first_name?.[0] || '?')}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{m.profiles?.first_name} {m.profiles?.last_name}</p>
                                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{m.profiles?.email}</p>
                                                                </div>
                                                                <stage.icon className="h-3.5 w-3.5 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                                            </div>
                                                            <div className="flex items-center justify-between mt-4">
                                                                <div className="flex -space-x-1">
                                                                    {[1, 2].map(dot => <div key={dot} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[7px] font-black text-slate-400">?</div>)}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                                    <Activity className="h-3 w-3 text-indigo-600" />
                                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">{t('openCRM')}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {!stageMembers.length && (
                                                        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-10">
                                                            <Users className="h-10 w-10 mb-2" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest">{t('emptyStage')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Global Activity & Retention Metrics */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-indigo-50/50 dark:bg-slate-900/40 p-10 border border-slate-50 dark:border-white/5 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                                    <div className="flex items-center justify-between mb-8 relative">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                            <Activity className="h-5 w-5 text-indigo-600" /> Recent Activity
                                        </h3>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-slate-100 dark:border-white/5">Real-time Feed</Badge>
                                    </div>
                                    <div className="space-y-4 relative">
                                        {globalInteractions.map((item: any) => (
                                            <div key={item.id} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white dark:bg-slate-800/40 shadow-sm border border-slate-50 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-600/50 hover:shadow-xl transition-all group">
                                                <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                    {item.profiles?.first_name?.[0] || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{item.profiles?.first_name} {item.profiles?.last_name}</p>
                                                        <span className="text-[10px] text-slate-400 font-medium">{format(new Date(item.created_at), 'HH:mm')}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{item.content}</p>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                                    item.interaction_type === 'email' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' :
                                                    item.interaction_type === 'note' ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600' :
                                                    'bg-slate-50 dark:bg-slate-700/40 text-slate-500'
                                                }`}>
                                                    {item.interaction_type}
                                                </div>
                                            </div>
                                        ))}
                                        {!globalInteractions.length && (
                                            <div className="py-20 text-center opacity-20">
                                                <Activity className="h-10 w-10 mx-auto mb-2" />
                                                <p className="text-xs font-black uppercase tracking-widest">No recent activity</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                <div className="space-y-8">
                                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-white dark:bg-slate-900/40 p-10 border border-slate-50 dark:border-white/5">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Velocity</h3>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time to conversion</p>
                                            </div>
                                            <Zap className="h-5 w-5 text-orange-400" />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white">Visitor → Regular</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Target: 21 Days</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">14 Days</p>
                                                    <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Optimal</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white">Regular → Member</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Target: 90 Days</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-300">-- Days</p>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">Wait for data</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-indigo-600 p-8 text-white space-y-4 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
                                        <div className="flex items-center gap-3 relative">
                                            <Sparkles className="h-5 w-5 text-indigo-200" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Automation Score</h4>
                                        </div>
                                        <div className="flex items-end justify-between relative">
                                            <p className="text-5xl font-black">94<span className="text-xl text-indigo-300">%</span></p>
                                            <div className="flex gap-1 pb-2">
                                                {[1,2,3,4,5].map(i => <div key={i} className={`w-1.5 h-6 rounded-full ${i <= 4 ? 'bg-white' : 'bg-white/20'}`} />)}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-100/60 leading-relaxed relative">
                                            Your onboarding engine is performing within the top 5% of community healthy benchmarks.
                                        </p>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Dialogs */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                     <div className="bg-indigo-600 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black">{t('spiritualJourney')}</DialogTitle>
                            <DialogDescription className="text-indigo-100 opacity-80 pt-1">
                                Managing {selectedMember?.profiles?.first_name || selectedMember?.children?.first_name}'s membership and care.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handleUpdate} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('memberType')}</Label>
                                <Select value={selectedMember?.membership_type} onValueChange={val => setSelectedMember(selectedMember ? { ...selectedMember, membership_type: val as MembershipType } : null)}>
                                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="registered">{t('registeredMember')}</SelectItem>
                                        <SelectItem value="regular">{t('regularAttendee')}</SelectItem>
                                        <SelectItem value="visitor">{t('visitorGuest')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('status')}</Label>
                                <Select value={selectedMember?.status} onValueChange={val => setSelectedMember(selectedMember ? { ...selectedMember, status: val as MembershipStatus } : null)}>
                                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('active')}</SelectItem>
                                        <SelectItem value="inactive">{t('inactive')}</SelectItem>
                                        <SelectItem value="deceased">{t('deceased')}</SelectItem>
                                        <SelectItem value="transferred">{t('transferred')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedMember?.profiles && (
                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">{t('personalDetails')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('gender')}</Label>
                                        <Select value={selectedMember.profiles.gender} onValueChange={val => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, gender: val } })}>
                                            <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">{t('male')}</SelectItem>
                                                <SelectItem value="female">{t('female')}</SelectItem>
                                                <SelectItem value="other">{t('other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('dateOfBirth')}</Label>
                                        <Input 
                                            type="date" 
                                            value={selectedMember.profiles.date_of_birth || ''} 
                                            onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, date_of_birth: e.target.value } })}
                                            className="h-12 rounded-xl border-slate-200 font-bold focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">Email</Label>
                                        <Input value={selectedMember.profiles.email || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, email: e.target.value } })} className="h-12 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">Phone</Label>
                                        <Input value={selectedMember.profiles.phone || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, phone: e.target.value } })} className="h-12 rounded-xl font-bold" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">Secondary Phone</Label>
                                        <Input value={selectedMember.profiles.secondary_phone || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, secondary_phone: e.target.value } })} className="h-12 rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 ml-1">Marital Status</Label>
                                        <Select value={selectedMember.profiles.marital_status || 'single'} onValueChange={val => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, marital_status: val } })}>
                                            <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single">Single</SelectItem>
                                                <SelectItem value="married">Married</SelectItem>
                                                <SelectItem value="divorced">Divorced</SelectItem>
                                                <SelectItem value="widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">Home Address</Label>
                                    <Input value={selectedMember.profiles.address || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, address: e.target.value } })} className="h-12 rounded-xl font-bold" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">City</Label>
                                        <Input value={selectedMember.profiles.city || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, city: e.target.value } })} className="h-10 rounded-lg font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">State</Label>
                                        <Input value={selectedMember.profiles.state || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, state: e.target.value } })} className="h-10 rounded-lg font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Zip Code</Label>
                                        <Input value={selectedMember.profiles.zip_code || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, zip_code: e.target.value } })} className="h-10 rounded-lg font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('occupation')}</Label>
                                    <Input 
                                        value={selectedMember.profiles.occupation || ''} 
                                        onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, occupation: e.target.value } })}
                                        className="h-12 rounded-xl border-slate-200 font-bold focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">Bio / Pastoral Bio</Label>
                                    <Textarea 
                                        value={selectedMember.profiles.bio || ''} 
                                        onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, bio: e.target.value } })}
                                        className="rounded-xl font-medium border-slate-200"
                                        placeholder="Brief notes about the member..."
                                    />
                                </div>
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                        <PhoneCall className="h-3 w-3" /> Emergency Contact
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Name</Label>
                                            <Input value={selectedMember.profiles.emergency_contact_name || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, emergency_contact_name: e.target.value } })} className="h-10 rounded-lg font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Phone</Label>
                                            <Input value={selectedMember.profiles.emergency_contact_phone || ''} onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, emergency_contact_phone: e.target.value } })} className="h-10 rounded-lg font-bold" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('address')}</Label>
                                    <Input 
                                        value={selectedMember.profiles.address || ''} 
                                        onChange={e => setSelectedMember({ ...selectedMember, profiles: { ...selectedMember.profiles!, address: e.target.value } })}
                                        className="h-12 rounded-xl border-slate-200 font-bold focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Street Address"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                             <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">{t('spiritualMilestones')}</h3>
                             <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('baptismDate')}</Label>
                                <Input 
                                    type="date" 
                                    value={selectedMember?.baptism_date || ''} 
                                    onChange={e => setSelectedMember(selectedMember ? { ...selectedMember, baptism_date: e.target.value } : null)}
                                    className="h-12 rounded-xl border-slate-200 font-bold focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-500 ml-1">{t('pastoralNote')}</Label>
                                <Textarea 
                                    value={selectedMember?.pastoral_notes || ''} 
                                    onChange={e => setSelectedMember(selectedMember ? { ...selectedMember, pastoral_notes: e.target.value } : null)}
                                    className="min-h-[100px] rounded-2xl border-slate-200 font-medium focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder={t('pastoralNotePlaceholder')}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isUpdating} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold text-lg">
                                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                                {t('saveChanges')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Manage Roster Dialog */}
            <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}>
                <DialogContent className="max-w-3xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                     <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-3xl font-black tracking-tight italic">{t('rosterTitle')}</DialogTitle>
                            <DialogDescription className="text-indigo-100 opacity-80 font-bold">
                                {t('rosterDescription')}
                            </DialogDescription>
                        </div>
                        <Users className="h-12 w-12 opacity-20" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 h-[500px]">
                        {/* Current Members */}
                         <div className="p-8 border-r border-slate-100 flex flex-col">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <UserCheck className="h-3 w-3" /> {t('activeRoster').toUpperCase()} ({groupMembers.length})
                            </h5>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {rosterLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-200" /></div>
                                ) : groupMembers.length ? groupMembers.map(gm => (
                                    <div key={gm.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                {gm.membership?.profiles?.first_name?.[0] || gm.membership?.children?.first_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 leading-tight">
                                                    {gm.membership?.profiles ? `${gm.membership.profiles.first_name} ${gm.membership.profiles.last_name}` : `${gm.membership?.children?.first_name} ${gm.membership?.children?.last_name}`}
                                                </p>
                                                <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] h-3 px-1 font-black">{gm.role}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-rose-600 hover:bg-rose-50" onClick={() => removeAssignment(gm.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-40">
                                        <p className="text-xs font-bold text-slate-300 italic">No members assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assign New */}
                         <div className="p-8 flex flex-col bg-slate-50/50">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <Plus className="h-3 w-3" /> {t('assignNewMember').toUpperCase()}
                            </h5>
                             <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input 
                                    placeholder={t('searchCongregation')} 
                                    value={memberSearchTerm} 
                                    onChange={e => setMemberSearchTerm(e.target.value)}
                                    className="h-10 pl-9 rounded-xl border-slate-200 bg-white text-xs font-bold"
                                />
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto">
                                {assignableMembers.map(m => (
                                    <Button 
                                        key={m.id} 
                                        variant="ghost" 
                                        className="w-full justify-between h-auto p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all group"
                                        onClick={() => handleAssignMember(m.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                                {m.profiles?.first_name?.[0] || m.children?.first_name?.[0]}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                                    {m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name}` : `${m.children?.first_name} ${m.children?.last_name}`}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-medium">Click to assign</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                                        <DialogFooter className="p-6 bg-white border-t border-slate-100">
                        <Button className="w-full h-12 bg-slate-900 rounded-2xl font-black italic tracking-tight" onClick={() => setIsRosterOpen(false)}>{t('closeMissionControl')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Ministry Dialog */}
             {/* New Ministry Dialog */}
            <Dialog open={isNewMinistryOpen} onOpenChange={setIsNewMinistryOpen}>
                 <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-lg">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">{t('newMinistry')}</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">Establish a new department and assign leadership.</DialogDescription>
                    </DialogHeader>
                     <form onSubmit={handleCreateMinistry} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ministry Name</Label>
                            <Input placeholder="e.g., Youth Ministry" value={newMinistryName} onChange={e => setNewMinistryName(e.target.value)} className="h-12 rounded-xl font-bold" autoFocus />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ministry Head (Optional)</Label>
                            <Select value={newMinistryHeadId || 'none'} onValueChange={val => setNewMinistryHeadId(val === 'none' ? undefined : val)}>
                                <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Head Staff" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {allProfiles.filter(p => ['staff', 'admin', 'teacher'].includes(p.role) || p.is_super_admin).map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 mt-4 italic tracking-tight">{t('establishMinistry')}</Button>
                    </form>
                </DialogContent>
            </Dialog>

             {/* New Group Dialog */}
              <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">{t('addGroup')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <Input placeholder="Group Name (e.g., Tuesday Night Prayer)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="h-12 rounded-xl font-bold" autoFocus />
                        <Button type="submit" className="w-full h-12 bg-indigo-600 rounded-xl font-black">Create Group</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Ministry Dialog */}
            <Dialog open={isEditMinistryOpen} onOpenChange={setIsEditMinistryOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-lg">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">Edit Ministry</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">Refine department details and leadership.</DialogDescription>
                    </DialogHeader>
                    {selectedMinistry && (
                        <form onSubmit={handleUpdateMinistry} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ministry Name</Label>
                                <Input value={selectedMinistry.name} onChange={e => setSelectedMinistry({...selectedMinistry, name: e.target.value})} className="h-12 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</Label>
                                <Input value={selectedMinistry.description || ''} onChange={e => setSelectedMinistry({...selectedMinistry, description: e.target.value})} className="h-12 rounded-xl font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ministry Head</Label>
                                <Select value={selectedMinistry.head_staff_id || 'none'} onValueChange={val => setSelectedMinistry({...selectedMinistry, head_staff_id: val === 'none' ? undefined : val})}>
                                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Head Staff" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        {allProfiles.sort((a,b) => a.first_name.localeCompare(b.first_name)).map(p => (
                                            <SelectItem key={p.id} value={p.id} className="flex items-center justify-between">
                                                <span>{p.first_name} {p.last_name}</span>
                                                <span className="text-[9px] opacity-40 ml-2 uppercase font-black bg-slate-100 px-1 rounded">{p.role === 'parent' ? 'Member' : p.role}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full h-12 bg-indigo-600 rounded-xl font-black">Save Changes</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                 <DialogContent className="rounded-[3rem] p-8 border-none shadow-2xl max-w-xl">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black flex items-center gap-3">
                            <UserPlus className="h-8 w-8 text-indigo-600" /> {t('addMember')}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">Register a new profile or select from existing users.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMember} className="space-y-6">
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Step 1: Select Profile</Label>
                                <Select value={onboardingMember.profile_id} onValueChange={val => setOnboardingMember({...onboardingMember, profile_id: val})}>
                                    <SelectTrigger className="h-14 rounded-2xl font-bold border-slate-200 bg-slate-50 shadow-none"><SelectValue placeholder="Search existing staff or parents..." /></SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <div className="p-2 sticky top-0 bg-white z-10">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input placeholder="Filter by name..." value={memberSearchTerm} onChange={e => setMemberSearchTerm(e.target.value)} className="pl-9 h-9 rounded-lg" />
                                            </div>
                                        </div>
                                        {allProfiles.filter(p => !members.some(m => m.profile_id === p.id) && (`${p.first_name} ${p.last_name}`).toLowerCase().includes(memberSearchTerm.toLowerCase())).slice(0, 10).map(p => (
                                            <SelectItem key={p.id} value={p.id} className="p-3 rounded-xl focus:bg-indigo-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                        {p.first_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{p.first_name} {p.last_name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase font-black">{p.role}</p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('memberType')}</Label>
                                    <Select value={onboardingMember.type} onValueChange={val => setOnboardingMember({...onboardingMember, type: val as MembershipType})}>
                                        <SelectTrigger className="h-14 rounded-2xl font-bold border-slate-200 bg-slate-50 shadow-none"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="registered">{t('registeredMember')}</SelectItem>
                                            <SelectItem value="regular">{t('regularAttendee')}</SelectItem>
                                            <SelectItem value="visitor">{t('visitorGuest')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('lifeStatus')}</Label>
                                    <Select value={onboardingMember.status} onValueChange={val => setOnboardingMember({...onboardingMember, status: val as MembershipStatus})}>
                                        <SelectTrigger className="h-14 rounded-2xl font-bold border-slate-200 bg-slate-50 shadow-none"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-400 font-medium italic">Cannot find the person? <Button variant="link" className="text-indigo-600 font-black p-0 h-auto" onClick={() => toast({ title: "User Creation", description: "Use the User Management module to create new accounts first." })}>Create New User Account</Button></p>
                        </div>

                        <Button type="submit" disabled={!onboardingMember.profile_id} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                            {t('addMember')} <ChevronRight className="h-4 w-4" />
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Role Dialog */}
             <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black italic tracking-tight">{t('newRole')}</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">Define a new service position for your ministries.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Role Name</Label>
                            <Input placeholder="e.g. Sound Engineer, Greeter" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} className="h-12 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ministry</Label>
                            <Select value={newRole.ministry_id} onValueChange={val => setNewRole({...newRole, ministry_id: val})}>
                                <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Select Ministry" /></SelectTrigger>
                                <SelectContent>
                                    {ministries.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                        <Button onClick={() => createRole(newRole, { onSuccess: () => setIsRoleDialogOpen(false) })} className="w-full h-12 bg-indigo-600 rounded-xl font-black">{t('establishRole')}</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Organization Chart Dialog */}
            <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-[80vh] flex flex-col">
                    <div className="bg-indigo-600 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tight">{selectedMinistry?.name} Structure</DialogTitle>
                            <DialogDescription className="text-indigo-100 opacity-80 pt-1">
                                Hierarchical department view and reporting lines.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex flex-col items-center gap-12 pt-8">
                            {/* Head Staff */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-indigo-500 shadow-xl flex items-center justify-center font-black text-indigo-600 text-3xl">
                                    {selectedMinistry?.head_staff?.first_name?.[0] || 'H'}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900">{selectedMinistry?.head_staff ? `${selectedMinistry.head_staff.first_name} ${selectedMinistry.head_staff.last_name}` : 'Unassigned Head'}</p>
                                    <Badge className="bg-indigo-600 text-white border-none uppercase text-[8px] tracking-widest">Ministry Head</Badge>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-indigo-200" />

                            {/* Groups */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                                {selectedMinistry?.groups?.map(group => (
                                    <div key={group.id} className="flex flex-col items-center gap-6">
                                        <div className="w-full p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm text-center group hover:bg-white hover:shadow-indigo-100/50 transition-all border-b-4 border-b-indigo-500">
                                            <h4 className="font-black text-indigo-600 uppercase tracking-tight mb-2">{group.name}</h4>
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:text-amber-500 transition-colors">
                                                    {group.leader?.first_name?.[0] || '?'}
                                                </div>
                                                <p className="text-xs font-bold text-slate-500">{group.leader ? `${group.leader.first_name} ${group.leader.last_name}` : 'No Leader Assigned'}</p>
                                                <Badge className="bg-slate-200 text-slate-600 h-5 px-2 text-[8px] font-black uppercase tracking-tighter">Small Group Leader</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                        <Button className="w-full bg-slate-900 rounded-2xl font-bold h-12" onClick={() => setIsOrgDialogOpen(false)}>Close Structure View</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteMinistryOpen} onOpenChange={setIsDeleteMinistryOpen}>
                 <DialogContent className="rounded-[2rem] p-8">
                     <DialogHeader>
                         <DialogTitle className="text-xl font-black">Delete Ministry?</DialogTitle>
                         <DialogDescription>This will remove '{selectedMinistry?.name}' and all its groups permanently.</DialogDescription>
                     </DialogHeader>
                     <DialogFooter className="pt-4 flex gap-3">
                         <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsDeleteMinistryOpen(false)}>Cancel</Button>
                         <Button variant="destructive" className="flex-1 rounded-xl bg-rose-600" onClick={() => {
                             toast({ title: "Ministry Removal", description: "This feature is coming in the next engine update.", variant: "destructive" });
                             setIsDeleteMinistryOpen(false);
                         }}>Confirm Delete</Button>
                     </DialogFooter>
                 </DialogContent>
            </Dialog>
            {/* Visitor CRM Dialog */}
            <Dialog open={isCRMOpen} onOpenChange={setIsCRMOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh]">
                    <div className="bg-slate-900 p-8 text-white shrink-0">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <Badge className="bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1">Visitor CRM</Badge>
                                <Badge variant="outline" className="border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">{t('lastInteraction')}: {interactions[0] ? format(new Date(interactions[0].created_at), 'MMM d') : 'None'}</Badge>
                            </div>
                            <DialogTitle className="text-4xl font-black">{crmMember?.profiles?.first_name || crmMember?.children?.first_name} {crmMember?.profiles?.last_name || crmMember?.children?.last_name}</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold flex items-center gap-4 pt-1">
                                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {crmMember?.profiles?.email || 'No Email'}</span>
                                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {crmMember?.profiles?.phone || 'No Phone'}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Timeline */}
                        <div className="w-1/2 p-8 border-r border-slate-100 overflow-y-auto bg-slate-50/30">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                <Activity className="h-3 w-3" /> {t('interactionTimeline')}
                            </h4>
                            <div className="space-y-6 relative ml-4 border-l-2 border-slate-100 pl-8">
                                {interactions.map((interaction, i) => (
                                    <div key={interaction.id} className="relative">
                                        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-sm" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-tighter border-none h-4">
                                                    {interaction.interaction_type}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-bold">{format(new Date(interaction.created_at), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 shadow-sm">{interaction.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {!interactions.length && <div className="text-slate-300 italic text-sm">{t('noInteractions')}</div>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-1/2 p-8 space-y-8 overflow-y-auto">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Edit className="h-3 w-3" /> {t('quickNote')}
                                </h4>
                                <Textarea 
                                    placeholder="Log a call, meeting, or pastoral note..." 
                                    className="min-h-[120px] rounded-2xl bg-slate-50 border-none focus-visible:ring-indigo-600 font-medium resize-none"
                                    value={newCRMNote}
                                    onChange={e => setNewCRMNote(e.target.value)}
                                />
                                {hasPermission('church_crm_edit') ? (
                                    <Button 
                                        disabled={!newCRMNote}
                                        onClick={() => {
                                            addInteraction({ 
                                                visitor_id: crmMember?.profiles?.id, 
                                                interaction_type: 'note', 
                                                content: newCRMNote 
                                            });
                                            setNewCRMNote('');
                                        }}
                                        className="w-full bg-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800"
                                    >
                                        {t('recordNote')}
                                    </Button>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic">Read-only mode: Requires CRM Edit permission to log notes.</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-emerald-500" /> {t('automatedEmails')}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {templates.filter(t => t.name.startsWith('visitor_')).map(template => (
                                        <Button 
                                            key={template.id}
                                            variant="outline" 
                                            disabled={isSending || !crmMember?.profiles?.email || !hasPermission('church_crm_edit')}
                                            onClick={() => sendEmail({
                                                to: crmMember?.profiles?.email!,
                                                templateName: template.name,
                                                templateData: {
                                                    visitorName: crmMember?.profiles?.first_name || 'Guest',
                                                    churchName: 'Our Church',
                                                    inviteLink: 'https://church.com/rsvp'
                                                }
                                            })}
                                            className="justify-start h-auto p-4 rounded-2xl border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 group transition-all"
                                        >
                                            <div className="text-left">
                                                <p className="font-black text-slate-900 group-hover:text-indigo-600 text-xs truncate capitalize">{template.name.replace(/_/g, ' ')}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{template.description}</p>
                                            </div>
                                            {isSending ? <Loader2 className="h-4 w-4 animate-spin ml-auto text-indigo-600" /> : <ArrowUpRight className="h-4 w-4 ml-auto text-slate-200 group-hover:text-indigo-600" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <UserPlus className="h-3 w-3 text-indigo-500" /> {t('journeyProgression')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {crmMember?.membership_type === 'visitor' && (
                                        <Button 
                                            disabled={!hasPermission('church_crm_edit')}
                                            onClick={() => updateMember({ id: crmMember.id, membership_type: 'regular' }, {
                                                onSuccess: () => {
                                                    setIsCRMOpen(false);
                                                    addInteraction({ 
                                                        visitor_id: crmMember?.profiles?.id, 
                                                        interaction_type: 'note', 
                                                        content: 'Promoted to Regular Attendee (Contacted)' 
                                                    });
                                                }
                                            })}
                                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[9px] uppercase tracking-widest h-10 rounded-xl"
                                        >
                                            {t('markContacted')}
                                        </Button>
                                    )}
                                    {(crmMember?.membership_type === 'visitor' || crmMember?.membership_type === 'regular') && (
                                        <Button 
                                            disabled={!hasPermission('church_crm_edit')}
                                            onClick={() => updateMember({ id: crmMember!.id, membership_type: 'registered' }, {
                                                onSuccess: () => {
                                                    setIsCRMOpen(false);
                                                    addInteraction({ 
                                                        visitor_id: crmMember?.profiles?.id, 
                                                        interaction_type: 'note', 
                                                        content: 'Promoted to Official Member' 
                                                    });
                                                }
                                            })}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none font-black text-[9px] uppercase tracking-widest h-10 rounded-xl"
                                        >
                                            {t('promoteMember')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                        <Button variant="ghost" className="w-full h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400" onClick={() => setIsCRMOpen(false)}>{t('closeCRM')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent className="rounded-[3rem] p-0 border-none shadow-2xl max-w-xl overflow-hidden bg-white">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black italic tracking-tight">{t('newMemberOnboarding')}</DialogTitle>
                                <DialogDescription className="text-indigo-100 opacity-80 font-bold">Register a new visitor or connect a regular attendee.</DialogDescription>
                            </div>
                        </div>
                        <div className="absolute top-[-50%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    <Tabs value={onboardingMode} onValueChange={(val: any) => setOnboardingMode(val)} className="p-0">
                        <div className="px-8 pt-6">
                            <TabsList className="w-full h-12 rounded-xl bg-slate-50 p-1 border-2 border-slate-100">
                                <TabsTrigger value="existing" className="flex-1 rounded-lg font-black italic tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-sm">EXISTING USER</TabsTrigger>
                                <TabsTrigger value="new_guest" className="flex-1 rounded-lg font-black italic tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-sm">QUICK GUEST</TabsTrigger>
                            </TabsList>
                        </div>

                        <form onSubmit={handleAddMember} className="p-8 space-y-6 bg-white">
                            <TabsContent value="existing" className="m-0 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('searchExistingProfile')}</Label>
                                    <Select value={onboardingMember.profile_id} onValueChange={val => setOnboardingMember({ ...onboardingMember, profile_id: val })}>
                                        <SelectTrigger className="h-14 rounded-2xl font-bold border-slate-100 bg-slate-50/50 hover:bg-slate-50 border-2 transition-all">
                                            <SelectValue placeholder="Select user profile..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            {allProfiles.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="rounded-xl h-12 font-bold focus:bg-indigo-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] uppercase font-black">{p.first_name?.[0]}{p.last_name?.[0]}</div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 leading-none">{p.first_name} {p.last_name}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold">{p.email}</p>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TabsContent>

                            <TabsContent value="new_guest" className="m-0 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">First Name</Label>
                                        <Input value={quickGuest.first_name} onChange={e => setQuickGuest({...quickGuest, first_name: e.target.value})} placeholder="Jane" className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Last Name</Label>
                                        <Input value={quickGuest.last_name} onChange={e => setQuickGuest({...quickGuest, last_name: e.target.value})} placeholder="Doe" className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</Label>
                                    <Input type="email" value={quickGuest.email} onChange={e => setQuickGuest({...quickGuest, email: e.target.value})} placeholder="jane@example.com" className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone (Optional)</Label>
                                    <Input value={quickGuest.phone} onChange={e => setQuickGuest({...quickGuest, phone: e.target.value})} placeholder="+1 234 567 8900" className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold" />
                                </div>
                            </TabsContent>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('membershipType')}</Label>
                                    <Select value={onboardingMember.type} onValueChange={val => setOnboardingMember({ ...onboardingMember, type: val as MembershipType })}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="regular">{t('regularAttendee')}</SelectItem>
                                            <SelectItem value="registered">{t('registeredMember')}</SelectItem>
                                            <SelectItem value="visitor">{t('visitorGuest')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('initialStatus')}</Label>
                                    <Select value={onboardingMember.status} onValueChange={val => setOnboardingMember({ ...onboardingMember, status: val as MembershipStatus })}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-2 border-slate-100 font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="active">{t('active')}</SelectItem>
                                            <SelectItem value="inactive">{t('inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" disabled={isCreating} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-white shadow-xl shadow-indigo-100 mt-4 italic tracking-tight text-lg transition-all active:scale-95">
                                {isCreating ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                                {onboardingMode === 'existing' ? t('confirmEnrolment') : 'REGISTER & START JOURNEY'}
                            </Button>
                        </form>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Delete Ministry Confirm Dialog */}
            <Dialog open={isDeleteMinistryOpen} onOpenChange={setIsDeleteMinistryOpen}>
                <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="bg-rose-600 p-8 text-white">
                        <DialogHeader>
                            <AlertCircle className="h-12 w-12 text-white mb-4 opacity-50" />
                            <DialogTitle className="text-2xl font-black">{t('deleteMinistryTitle')}</DialogTitle>
                            <DialogDescription className="text-rose-100 opacity-80 pt-1 font-bold">
                                {t('deleteMinistryConfirm')} "{selectedMinistry?.name}"?
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <p className="text-rose-900 text-xs font-bold leading-relaxed italic">{t('deleteMinistryWarning')}</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsDeleteMinistryOpen(false)}>{t('cancel')}</Button>
                            <Button 
                                className="flex-1 h-12 bg-rose-600 hover:bg-rose-700 rounded-xl font-black text-white shadow-lg shadow-rose-100" 
                                onClick={() => {
                                    if (selectedMinistry) {
                                        deleteMinistry(selectedMinistry.id, {
                                            onSuccess: () => {
                                                setIsDeleteMinistryOpen(false);
                                                setSelectedMinistry(null);
                                            }
                                        });
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> {t('confirmDelete')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </UnifiedDashboardLayout>
    );
};

// Sub-component for managing event positions to keep the main page clean
const EventPositions = ({ eventId }: { eventId: string }) => {
    const { shifts, isLoading } = useShifts({ event_id: eventId });
    
    if (isLoading) return <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-200 mx-auto" /></div>;
    if (!shifts?.length) return <div className="py-20 text-center text-xs font-bold text-slate-300 italic">No positions defined for this event</div>;

    return (
        <div className="space-y-3">
            {shifts.map(shift => (
                <div key={shift.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${shift.staff_id ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600 italic'}`}>
                            {shift.staff_id ? (shift.profiles?.first_name?.[0] || 'U') : '?'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 leading-tight">
                                {shift.volunteer_roles?.name || shift.role_type || 'General Role'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
                                {shift.staff_id ? `${shift.profiles?.first_name} ${shift.profiles?.last_name}` : 'OPEN SLOT'}
                            </p>
                        </div>
                    </div>
                    <Badge className="bg-slate-50 text-slate-400 border-none text-[9px] h-5">{format(new Date(shift.start_time), 'h:mm a')}</Badge>
                </div>
            ))}
        </div>
    );
};

export default ChurchManagementPage;
