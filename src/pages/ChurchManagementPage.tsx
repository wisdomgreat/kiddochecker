import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  Users, Search, Plus, Loader2, ChevronRight, Activity, Layers, Heart, Edit, UserPlus, ClipboardList, LayoutGrid, BarChart3
} from 'lucide-react';
import { useMembers, ChurchMember, MembershipType, MembershipStatus } from '@/hooks/useMembers';
import { useMinistries } from '@/hooks/useMinistries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberCRMDialog from '@/components/crm/MemberCRMDialog';
import JourneyKanbanBoard from '@/components/crm/JourneyKanbanBoard';
import DonationTracker from '@/components/crm/DonationTracker';
import VisitorJourneyBoard from '@/components/crm/VisitorJourneyBoard';

const ChurchManagementPage = () => {
    const { t } = useTranslation();
    const { members, stats, isLoading: membersLoading, updateMember, createVisitor } = useMembers();
    const { ministries, isLoading: ministriesLoading, createMinistry, createGroup, assignMember } = useMinistries();
    
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

    const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

    return (
        <UnifiedDashboardLayout>
          <TooltipProvider>
            <div className="space-y-8 max-w-7xl mx-auto py-8 px-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">{t('churchManagement')}</h1>
                        <p className="text-sm text-muted-foreground">Manage your congregation, ministries, and community growth.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsAddMemberOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Enroll Person
                        </Button>
                    </div>
                </div>

                {/* Perspective Selection */}
                <Tabs value={activePerspective} onValueChange={setActivePerspective} className="w-full">
                    <TabsList className="bg-muted/50 p-1 mb-8">
                        <TabsTrigger value="members" className="font-bold text-[10px] uppercase tracking-wider">
                            <Users className="h-3.5 w-3.5 mr-2" /> Candidates
                        </TabsTrigger>
                        <TabsTrigger value="ministries" className="font-bold text-[10px] uppercase tracking-wider">
                            <LayoutGrid className="h-3.5 w-3.5 mr-2" /> Ministries
                        </TabsTrigger>
                        <TabsTrigger value="visitor_crm" className="font-bold text-[10px] uppercase tracking-wider">
                            <Heart className="h-3.5 w-3.5 mr-2" /> Care Board
                        </TabsTrigger>
                        <TabsTrigger value="kanban" className="font-bold text-[10px] uppercase tracking-wider">
                            <ClipboardList className="h-3.5 w-3.5 mr-2" /> Workflow
                        </TabsTrigger>
                        <TabsTrigger value="journey" className="font-bold text-[10px] uppercase tracking-wider">
                            <BarChart3 className="h-3.5 w-3.5 mr-2" /> Analytics
                        </TabsTrigger>
                    </TabsList>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Congregation', val: stats?.total_members || 0, icon: Users, color: 'text-foreground' },
                            { label: 'Total Guests', val: stats?.visitor_count || 0, icon: UserPlus, color: 'text-foreground' },
                            { label: 'In Discipleship', val: stats?.regular_count || 0, icon: Heart, color: 'text-foreground' },
                            { label: 'Interaction Rate', val: `${stats?.integrations_perc || 0}%`, icon: Activity, color: 'text-foreground' }
                        ].map((s, i) => (
                            <Card key={i} className="shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-2xl font-bold">{s.val}</h4>
                                        <s.icon className={cn("h-4 w-4", s.color)} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <TabsContent value="members" className="space-y-6">
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-dashed">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search congregation..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="pl-9" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {membersLoading ? (
                                <div className="col-span-full py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                            ) : filteredMembers.map(member => (
                                <Card key={member.id} className="shadow-sm hover:shadow-md transition-shadow">
                                     <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {member.profiles?.first_name?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight h-5">
                                                        {member.membership_type}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-base font-bold truncate">{member.profiles?.first_name} {member.profiles?.last_name}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-6">
                                            <Button variant="outline" size="sm" className="flex-1 h-9 font-bold text-[10px] uppercase" onClick={() => { setCrmMember(member); setIsCRMOpen(true); }}>
                                                View File
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectedMember(member); setIsEditDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                     </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="ministries" className="space-y-8">
                        {ministriesLoading ? (
                            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                        ) : ministries.length === 0 ? (
                            <Card className="p-20 text-center border-dashed">
                                <Layers className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">No active ministries</p>
                                <Button variant="link" onClick={() => setIsAddMinistryOpen(true)}>Create First Department</Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {ministries.map(ministry => (
                                    <div key={ministry.id} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-900 dark:bg-card flex items-center justify-center">
                                                    <Layers className="h-4 w-4 text-white dark:text-foreground" />
                                                </div>
                                                <h3 className="text-lg font-bold">{ministry.name}</h3>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase" onClick={() => { setSelectedMinistryId(ministry.id); setIsAddGroupOpen(true); }}>
                                                Add Group
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                            {ministry.groups?.map(group => (
                                                <Card key={group.id} className="shadow-sm">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-sm">{group.name}</h4>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                                                <Activity className="h-3 w-3" />
                                                                {group.meeting_day} at {group.meeting_time}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Badge className="font-bold text-[9px] uppercase">{group.member_count || 0} Members</Badge>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedGroupId(group.id); setIsAssignMemberOpen(true); }}>
                                                                <UserPlus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="visitor_crm">
                        <VisitorJourneyBoard />
                    </TabsContent>

                    <TabsContent value="kanban">
                        <JourneyKanbanBoard />
                    </TabsContent>

                    <TabsContent value="journey">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <Card className="p-6 bg-slate-900 text-white shadow-lg">
                                <CardContent className="p-0 flex flex-col justify-between h-32">
                                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Entry Phase</p>
                                     <div className="flex items-baseline justify-between">
                                         <span className="text-4xl font-bold">{stats?.visitor_count || 0}</span>
                                         <Badge className="bg-card/10 text-white font-bold text-[9px]">+12%</Badge>
                                     </div>
                                     <h3 className="text-sm font-bold uppercase">New Guests Found</h3>
                                </CardContent>
                            </Card>

                            <Card className="p-6">
                                <CardContent className="p-0 flex flex-col justify-between h-32">
                                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement Phase</p>
                                     <span className="text-4xl font-bold">{stats?.active_journey || 0}</span>
                                     <h3 className="text-sm font-bold uppercase">Active Care Paths</h3>
                                </CardContent>
                             </Card>

                             <Card className="p-6">
                                <CardContent className="p-0 flex flex-col justify-between h-32">
                                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Commitment Phase</p>
                                     <span className="text-4xl font-bold">{stats?.integrations_perc || 0}%</span>
                                     <h3 className="text-sm font-bold uppercase">Congregation Retention</h3>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Member Acquisition Pipeline</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {[
                                    { stage: 'Initial Identification', count: stats?.visitor_count || 0, color: 'bg-slate-900' },
                                    { stage: 'Follow-up Contact', count: stats?.first_followup || 0, color: 'bg-slate-700' },
                                    { stage: 'Regular Engagement', count: stats?.regular_count || 0, color: 'bg-slate-500' },
                                    { stage: 'Formal Registration', count: stats?.registered_count || 0, color: 'bg-slate-300' }
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-6">
                                         <div className="w-48">
                                             <p className="text-[10px] font-bold uppercase text-muted-foreground">{step.stage}</p>
                                         </div>
                                         <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full", step.color)}
                                                style={{ width: `${(step.count / Math.max(stats?.visitor_count || 1, 1)) * 100}%` }}
                                            />
                                        </div>
                                         <div className="w-12 text-right">
                                             <p className="text-sm font-bold">{step.count}</p>
                                         </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <MemberCRMDialog 
                member={crmMember} 
                isOpen={isCRMOpen} 
                onOpenChange={setIsCRMOpen} 
            />

            {/* Modals Simplified */}
            <Dialog open={isAddMinistryOpen} onOpenChange={setIsAddMinistryOpen}>
                 <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Create Ministry</DialogTitle>
                        <DialogDescription>Define a new organizational department.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMinistry.name) return;
                        createMinistry({ name: newMinistry.name }, {
                            onSuccess: () => {
                                setIsAddMinistryOpen(false);
                                setNewMinistry({ name: '', description: '', head_staff_id: '' });
                            }
                        });
                    }} className="p-6 space-y-4">
                        <div className="space-y-2">
                             <Label className="text-xs font-bold uppercase">Department Name</Label>
                             <Input placeholder="e.g. Media Team" value={newMinistry.name} onChange={e => setNewMinistry({...newMinistry, name: e.target.value})} required />
                         </div>
                        <Button type="submit" className="w-full h-11 font-bold uppercase">Init Ministry</Button>
                    </form>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                 <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Enroll Person</DialogTitle>
                        <DialogDescription>Identify the nature of the enrollment.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 grid grid-cols-1 gap-3">
                        <Button variant="outline" className="h-20 flex flex-col items-start gap-1 p-6" onClick={() => { setIsAddMemberOpen(false); setIsAddVisitorOpen(true); }}>
                            <span className="font-bold text-base">New Guest Identification</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Start pastoral care journey</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-start gap-1 p-6" onClick={() => { setIsAddMemberOpen(false); window.location.href='/staff'; }}>
                            <span className="font-bold text-base">Internal Personnel Enrollment</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Onboard staff or volunteer</span>
                        </Button>
                    </div>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddVisitorOpen} onOpenChange={setIsAddVisitorOpen}>
                 <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Guest Identification</DialogTitle>
                        <DialogDescription>Start tracking a new person's engagement.</DialogDescription>
                    </DialogHeader>
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
                    }} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">First Name</Label>
                                <Input value={newVisitor.firstName} onChange={e => setNewVisitor({...newVisitor, firstName: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">Last Name</Label>
                                <Input value={newVisitor.lastName} onChange={e => setNewVisitor({...newVisitor, lastName: e.target.value})} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase">Communication Email</Label>
                            <Input type="email" value={newVisitor.email} onChange={e => setNewVisitor({...newVisitor, email: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase">Phone (Optional)</Label>
                            <Input value={newVisitor.phone} onChange={e => setNewVisitor({...newVisitor, phone: e.target.value})} />
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold uppercase mt-4">Start Care Path</Button>
                    </form>
                 </DialogContent>
            </Dialog>

            <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
                 <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Create Small Group</DialogTitle>
                    </DialogHeader>
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
                    }} className="p-6 space-y-4">
                         <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase">Group Designation</Label>
                            <Input value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">Recurrence</Label>
                                <Select value={newGroup.meetingDay} onValueChange={val => setNewGroup({...newGroup, meetingDay: val})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">Time</Label>
                                <Input type="time" value={newGroup.meetingTime} onChange={e => setNewGroup({...newGroup, meetingTime: e.target.value})} required />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold uppercase mt-2">Init Group</Button>
                    </form>
                 </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Refine Engagement</DialogTitle>
                    </DialogHeader>
                    {selectedMember && (
                        <form onSubmit={handleUpdate} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase">Constituent Type</Label>
                                <Select value={selectedMember.membership_type} onValueChange={val => setSelectedMember({...selectedMember, membership_type: val as MembershipType})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="visitor">Visitor / Guest</SelectItem>
                                        <SelectItem value="regular">Regular Attendee</SelectItem>
                                        <SelectItem value="registered">Registered Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold uppercase">Sync Profile</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignMemberOpen} onOpenChange={setIsAssignMemberOpen}>
                 <DialogContent className="p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-muted/50 border-b">
                        <DialogTitle>Unit Assignment</DialogTitle>
                        <DialogDescription>Assign a person from the congregation to this active group.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!selectedGroupId || !selectedMembershipId) return;
                        assignMember({ membershipId: selectedMembershipId, groupId: selectedGroupId, role: 'member' }, { 
                            onSuccess: () => {
                                setIsAssignMemberOpen(false);
                                setSelectedMembershipId('');
                            }
                        });
                    }} className="p-6 space-y-4">
                         <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase">Select Constituent</Label>
                            <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                                <SelectTrigger><SelectValue placeholder="Search members..." /></SelectTrigger>
                                <SelectContent className="max-h-64">
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.profiles?.first_name} {m.profiles?.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold uppercase">Authorize Assignment</Button>
                    </form>
                 </DialogContent>
            </Dialog>
          </TooltipProvider>
        </UnifiedDashboardLayout>
    );
};

export default ChurchManagementPage;

