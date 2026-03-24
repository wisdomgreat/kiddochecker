import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Mail, MessageSquare, Phone, Edit, ArrowUpRight, 
  BookOpen, Clock, CheckCircle2, AlertCircle, Trash2, Send, 
  Zap, X, ShieldCheck, UserPlus, Calendar, ChevronRight,
  MapPin, Briefcase, Heart, Users,
  Trophy, CircleDollarSign, ClipboardList, TrendingUp, PlusCircle,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useVisitorInteractions, VisitorInteraction } from '@/hooks/useVisitorInteractions';
import { useCRMManagement } from '@/hooks/useCRMManagement';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MemberCRMDialogProps {
  member: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberCRMDialog: React.FC<MemberCRMDialogProps> = ({ member, isOpen, onOpenChange }) => {
    const { user } = useAuth();
    const [newCRMNote, setNewCRMNote] = useState('');
    const { interactions, addInteraction, sendEmail, startVIPSeries, isSending } = useVisitorInteractions(member?.profiles?.id);
    const { tasks, addTask, updateTaskStatus } = useCRMManagement();
    const memberTasks = tasks.filter(t => t.member_id === member?.id);
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low'|'medium'|'high'|'urgent'>('medium');
    
    // Milestone Recording State
    const { recordMilestone, isRecording } = useMembers();
    const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
    const [milestoneType, setMilestoneType] = useState('Salvation');
    const [milestoneDate, setMilestoneDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [milestoneNotes, setMilestoneNotes] = useState('');
    
    // Fetch group assignments for this member
    const { data: assignments } = useQuery({
        queryKey: ['member-groups', member?.id],
        queryFn: async () => {
            if (!member?.id) return [];
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    id,
                    ministry:ministries (name)
                `)
                .eq('membership_id', member.id);
            if (error) throw error;
            return data;
        },
        enabled: !!member?.id
    });

    const [activeTab, setActiveTab] = useState('overview');

    // Fetch spiritual milestones
    const { data: milestones } = useQuery({
        queryKey: ['member-milestones', member?.id],
        queryFn: async () => {
            if (!member?.id) return [];
            const { data, error } = await supabase
                .from('milestones')
                .select('*')
                .eq('member_id', member.id)
                .order('attained_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!member?.id
    });

    // Fetch donation history
    const { data: donations } = useQuery({
        queryKey: ['member-donations', member?.id],
        queryFn: async () => {
            if (!member?.id) return [];
            const { data, error } = await supabase
                .from('financial_donations')
                .select('*')
                .eq('member_id', member.id)
                .order('donated_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!member?.id
    });

    const contactActions = {
        messageEmail: () => window.location.href = `mailto:${member?.profiles?.email}`,
        messageSMS: () => window.location.href = `sms:${member?.profiles?.phone || ''}`,
        call: () => window.location.href = `tel:${member?.profiles?.phone || ''}`,
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-white dark:bg-slate-950">
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Pane - Member Profile */}
                    <div className="w-1/3 bg-slate-50/50 dark:bg-slate-900 border-r border-slate-100 dark:border-white/5 p-8 flex flex-col pt-10">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Member Profile</h3>
                        
                        <div className="flex flex-col items-center mb-8">
                            <Avatar className="w-32 h-32 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-sm mb-4">
                                <AvatarImage src={member?.profiles?.avatar_url} />
                                <AvatarFallback className="bg-slate-200 text-slate-600 text-4xl font-bold">
                                    {member?.profiles?.first_name?.[0] || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                                {member?.profiles?.first_name} {member?.profiles?.last_name}
                            </h2>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm"><Phone className="h-3.5 w-3.5" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Phone</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{member?.profiles?.phone || 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm"><Mail className="h-3.5 w-3.5" /></div>
                                    <div className="truncate">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Email</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{member?.profiles?.email || 'No email registered'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm"><MapPin className="h-3.5 w-3.5" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Address</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{member?.profiles?.address || 'No address recorded'}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Member Since</p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{member?.joined_at ? format(new Date(member.joined_at), 'MMMM d, yyyy') : 'Recently'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Briefcase className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Departments & Roles</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {assignments && assignments.length > 0 ? assignments.map((a: any) => (
                                                <Badge key={a.id} variant="outline" className="text-[9px] h-5 px-2 bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 font-bold uppercase">{a.ministry?.name}</Badge>
                                            )) : <p className="text-xs font-medium text-slate-400 italic">No department active</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Heart className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">Small Groups</p>
                                        <p className="text-xs font-medium text-slate-400 italic">No assigned groups</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-3">
                            <Button onClick={contactActions.call} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-bold shadow-lg shadow-emerald-100 dark:shadow-none flex flex-col gap-0.5"><Phone className="h-4 w-4" /> <span className="text-[10px] uppercase">Call</span></Button>
                            <Button onClick={contactActions.messageSMS} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex flex-col gap-0.5"><MessageSquare className="h-4 w-4" /> <span className="text-[10px] uppercase">Text</span></Button>
                            
                                <div className="space-y-4">
                                    <Button 
                                        onClick={() => startVIPSeries({
                                            membership_id: member?.id,
                                            email: member?.profiles?.email,
                                            firstName: member?.profiles?.first_name
                                        })}
                                        disabled={isSending || member?.journey_stage === 'member'}
                                        className={`col-span-2 bg-slate-900 border-none text-white rounded-2xl h-14 font-black shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 ${
                                            member?.journey_stage === 'member' ? 'opacity-0 pointer-events-none hidden' : ''
                                        }`}
                                    >
                                        <Heart className="h-5 w-5 text-rose-400 animate-pulse" />
                                        <span className="text-xs uppercase tracking-tight">{isSending ? 'SENDING...' : 'SEND WELCOME JOURNEY'}</span>
                                    </Button>
                                    {member?.journey_stage !== 'member' && (
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-4 leading-relaxed">
                                            This will send a series of warm, welcoming messages over the next few weeks to help them feel at home.
                                        </p>
                                    )}
                                </div>

                            <Button variant="outline" className="col-span-2 rounded-2xl h-12 border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50"><Edit className="h-3.5 w-3.5 mr-2" /> View Detailed Log</Button>
                        </div>
                    </div>

                    {/* Right Pane - Activity & Timeline */}
                    <div className="flex-1 flex flex-col pt-10">
                        <Tabs defaultValue="overview" className="flex-1 flex flex-col px-10">
                            <div className="flex items-center justify-between mb-8">
                                <TabsList className="bg-slate-100/80 dark:bg-white/5 p-1 rounded-2xl h-14">
                                    <TabsTrigger value="overview" className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Timeline</TabsTrigger>
                                    <TabsTrigger value="journey" className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Journey</TabsTrigger>
                                    <TabsTrigger value="giving" className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Giving</TabsTrigger>
                                    <TabsTrigger value="tasks" className="rounded-xl px-6 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Planning & Care</TabsTrigger>
                                </TabsList>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all" onClick={() => onOpenChange(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
                                <TabsContent value="overview" className="mt-0 space-y-8 pb-10">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Interaction History</h4>
                                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">{interactions?.length || 0} Events</Badge>
                                    </div>

                                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-slate-50 before:to-transparent dark:before:from-white/10">
                                        {interactions?.length > 0 ? interactions.map((interaction, idx) => (
                                            <motion.div 
                                                key={interaction.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="relative flex items-start gap-8 pl-10"
                                            >
                                                <div className="absolute left-0 top-0 mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none ring-4 ring-white dark:ring-slate-950 z-10 transition-transform hover:scale-110">
                                                    {interaction.interaction_type === 'email' ? <Mail className="h-4 w-4 text-indigo-600" /> :
                                                     interaction.interaction_type === 'phone' ? <Phone className="h-4 w-4 text-emerald-600" /> :
                                                     interaction.interaction_type === 'note' ? <ClipboardList className="h-4 w-4 text-amber-600" /> :
                                                     <MessageSquare className="h-4 w-4 text-sky-600" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                                                            {interaction.interaction_type === 'note' ? 'STAFF LOG' : `${interaction.interaction_type} Interaction`}
                                                        </h5>
                                                        <p className="text-[10px] font-bold text-slate-400">{format(new Date(interaction.created_at), 'MMM d, h:mm a')}</p>
                                                    </div>
                                                    <Card className="p-4 rounded-2xl border-none shadow-sm bg-slate-50/50 dark:bg-white/5 group hover:bg-white dark:hover:bg-white/10 transition-all">
                                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{interaction.content}</p>
                                                        {(interaction as any).author && (
                                                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] font-black text-indigo-600 uppercase">
                                                                    {(interaction as any).author.first_name[0]}
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added by {(interaction as any).author.first_name}</span>
                                                            </div>
                                                        )}
                                                    </Card>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="py-24 text-center opacity-20">
                                                <Activity className="h-12 w-12 mx-auto mb-6 text-slate-300" />
                                                <p className="font-black uppercase tracking-[0.3em] text-xs">Awaiting First Interaction</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="journey" className="mt-0 space-y-8 pb-10">
                                     <div className="p-10 bg-indigo-600 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-indigo-200 dark:shadow-none">
                                        <SparklesIcon className="absolute -right-8 -top-8 w-48 h-48 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                                        <div className="relative z-10">
                                            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-3">Integration Level</p>
                                            <h3 className="text-5xl font-black tracking-tighter uppercase mb-6 drop-shadow-sm">{member?.journey_stage?.replace(/_/g, ' ') || 'DISCOVERY'}</h3>
                                            <div className="flex gap-3">
                                                <Badge className="bg-white/20 text-white border-none font-black text-xs uppercase h-8 px-5">VIP ONBOARDING</Badge>
                                                <Badge className="bg-white/20 text-white border-none font-black text-xs uppercase h-8 px-5">READY FOR GROWTH</Badge>
                                            </div>
                                        </div>
                                     </div>

                                     <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Spiritual Milestones</h4>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => setIsMilestoneDialogOpen(true)}
                                                className="h-9 px-4 rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50"
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" /> RECORD
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {milestones?.map(m => (
                                                <Card key={m.id} className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-none hover:shadow-md transition-all group">
                                                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                        <Trophy className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{m.milestone_type.replace(/_/g, ' ')}</h5>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{format(new Date(m.attained_at), 'MMMM yyyy')}</p>
                                                    </div>
                                                    {m.notes && <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase tracking-widest px-3">VERIFIED</Badge>}
                                                </Card>
                                            ))}
                                            {(!milestones || milestones.length === 0) && (
                                                <div className="p-16 border-4 border-dashed border-slate-50 rounded-[3rem] text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No milestones verified yet</div>
                                            )}
                                        </div>
                                     </div>
                                </TabsContent>

                                <TabsContent value="giving" className="mt-0 space-y-8 pb-10">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Card className="p-8 rounded-[2.5rem] bg-emerald-500 text-white border-none flex flex-col justify-between h-40 shadow-xl shadow-emerald-100 dark:shadow-none relative overflow-hidden">
                                            <CircleDollarSign className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Heart for the Kingdom</p>
                                            <h4 className="text-4xl font-black tracking-tighter">${donations?.reduce((acc, d) => acc + Number(d.amount), 0).toLocaleString()}</h4>
                                        </Card>
                                        <Card className="p-8 rounded-[2.5rem] bg-indigo-500 text-white border-none flex flex-col justify-between h-40 shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden">
                                            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Consistency</p>
                                            <h4 className="text-4xl font-black tracking-tighter">85%</h4>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Donation Feed</h4>
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">{donations?.length || 0} Transactions</Badge>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {donations?.map((donation, idx) => (
                                                <motion.div 
                                                    key={donation.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                >
                                                    <Card className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                                <CircleDollarSign className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{donation.ministry?.name || 'General Offering'}</h5>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{format(new Date(donation.donated_at), 'MMM d, h:mm a')}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-black text-emerald-600 text-lg">${Number(donation.amount).toLocaleString()}</span>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="tasks" className="mt-0 space-y-6 pb-10">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Care Follow-ups</h4>
                                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">{memberTasks.length} Active</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Card className="p-6 rounded-[2rem] bg-slate-50 border-dashed border-2 border-slate-200">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Quick Add Task</Label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            placeholder="Follow up on prayer request..." 
                                                            value={newTaskTitle}
                                                            onChange={e => setNewTaskTitle(e.target.value)}
                                                            className="flex-1 h-12 bg-white dark:bg-slate-900 border-none rounded-xl px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        />
                                                        <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                                                            <SelectTrigger className="w-24 h-12 bg-white dark:bg-slate-900 border-none rounded-xl font-bold text-[10px] uppercase shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                <SelectItem value="low">Low</SelectItem>
                                                                <SelectItem value="medium">Mid</SelectItem>
                                                                <SelectItem value="high">High</SelectItem>
                                                                <SelectItem value="urgent">Urgent</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button 
                                                            disabled={!newTaskTitle.trim()}
                                                            onClick={() => {
                                                                addTask({
                                                                    member_id: member.id,
                                                                    title: newTaskTitle,
                                                                    description: `Task created from CRM for ${member.profiles?.first_name}`,
                                                                    priority: newTaskPriority,
                                                                    status: 'todo'
                                                                }, { onSuccess: () => setNewTaskTitle('') });
                                                            }}
                                                            className="h-12 w-12 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <PlusCircle className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        {memberTasks.map(task => (
                                            <Card key={task.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm group hover:shadow-xl transition-all border border-transparent hover:border-indigo-100">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6",
                                                            task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                                        )}>
                                                            <ClipboardList className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{task.title}</h5>
                                                            <Badge className={cn(
                                                                "mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0 border-none",
                                                                task.priority === 'urgent' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                                                            )}>
                                                                {task.priority} Priority
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => updateTaskStatus({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })}
                                                        className={cn(
                                                            "rounded-xl font-black text-[9px] uppercase tracking-widest h-9 px-4",
                                                            task.status === 'done' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                                                        )}
                                                    >
                                                        {task.status === 'done' ? 'Task Completed' : 'Mark Done'}
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}

                                        {memberTasks.length === 0 && !newTaskTitle && (
                                            <div className="py-20 text-center opacity-20">
                                                <Zap className="h-12 w-12 mx-auto mb-6 text-slate-300" />
                                                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No active tasks assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                                
                                <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-slate-950 via-white dark:via-slate-950 to-transparent pt-10 pb-4 z-20">
                                    <div className="relative">
                                        <Textarea 
                                            placeholder="Type a staff note or observation..." 
                                            value={newCRMNote}
                                            onChange={e => setNewCRMNote(e.target.value)}
                                            className="min-h-[100px] rounded-3xl bg-slate-50/50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 p-5 pr-20 font-medium text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                                        />
                                        <Button 
                                            onClick={() => {
                                                if (!newCRMNote.trim()) return;
                                                addInteraction({
                                                    visitor_id: member?.profiles?.id,
                                                    interaction_type: 'note',
                                                    content: newCRMNote
                                                }, { onSuccess: () => setNewCRMNote('') });
                                            }}
                                            className="absolute bottom-4 right-4 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Send className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Milestone Recording Dialog */}
        <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
            <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950">
                <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.1, scale: 1 }}
                        className="absolute -right-10 -bottom-10"
                    >
                        <Trophy className="w-40 h-40" />
                    </motion.div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight relative z-10">Record Milestone</DialogTitle>
                    <DialogDescription className="text-indigo-100 font-medium relative z-10 transition-all">Document a significant spiritual event in their journey.</DialogDescription>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Event Type</Label>
                        <Select value={milestoneType} onValueChange={setMilestoneType}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="Salvation">First Time Salvation</SelectItem>
                                <SelectItem value="Rededication">Rededication</SelectItem>
                                <SelectItem value="Water Baptism">Water Baptism</SelectItem>
                                <SelectItem value="Holy Ghost Baptism">Holy Ghost Baptism</SelectItem>
                                <SelectItem value="First Volunteering">First Volunteering</SelectItem>
                                <SelectItem value="Leadership Track">Started Leadership Track</SelectItem>
                                <SelectItem value="Foundation School">Foundation School Grad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Date Attained</Label>
                        <input 
                            type="date"
                            value={milestoneDate}
                            onChange={e => setMilestoneDate(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Context / Notes</Label>
                        <Textarea 
                            placeholder="Additional details about the event..."
                            value={milestoneNotes}
                            onChange={e => setMilestoneNotes(e.target.value)}
                            className="min-h-[100px] rounded-2xl bg-slate-50 dark:bg-slate-900 border-none p-4 font-medium" 
                        />
                    </div>

                    <Button 
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all mt-4"
                        disabled={isRecording}
                        onClick={() => {
                            if (!member?.id) return;
                            recordMilestone({
                                member_id: member.id,
                                milestone_type: milestoneType,
                                attained_at: milestoneDate,
                                notes: milestoneNotes
                            }, {
                                onSuccess: () => {
                                    setIsMilestoneDialogOpen(false);
                                    setMilestoneNotes('');
                                }
                            });
                        }}
                    >
                        {isRecording ? 'RECORDING...' : 'CONFIRM MILESTONE'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default MemberCRMDialog;
