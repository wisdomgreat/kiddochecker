import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Activity, Mail, MessageSquare, Phone, Edit, ArrowUpRight, 
  BookOpen, Clock, CheckCircle2, AlertCircle, Trash2, Send, 
  Zap, X, ShieldCheck, UserPlus, Calendar, ChevronRight,
  MapPin, Briefcase, Heart, Users,
  Trophy, CircleDollarSign, ClipboardList, TrendingUp, PlusCircle,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useVisitorInteractions, VisitorInteraction } from '@/hooks/useVisitorInteractions';
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
    const { interactions, addInteraction, sendEmail, isSending } = useVisitorInteractions(member?.profiles?.id);
    
    // Fetch group assignments for this member
    const { data: assignments } = useQuery({
        queryKey: ['member-groups', member?.id],
        queryFn: async () => {
            if (!member?.id) return [];
            const { data, error } = await supabase
                .from('ministry_member_assignments')
                .select(`
                    role,
                    group:ministry_groups (
                        name,
                        ministry:ministries (name)
                    )
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
                .from('donations')
                .select('*')
                .eq('member_id', member.id)
                .order('donation_date', { ascending: false });
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
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Contact Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="h-4 w-4 text-indigo-600" />
                                        <span>Phone: {member?.profiles?.phone || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Mail className="h-4 w-4 text-indigo-600" />
                                        <span className="truncate">Email: {member?.profiles?.email || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin className="h-4 w-4 text-indigo-600 mt-0.5" />
                                        <span>Address: {member?.profiles?.address || 'No address recorded'}</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Church Details</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Calendar className="h-4 w-4 text-[#2B3481]" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">Member Since:</span>
                                            <span>{member?.joined_at ? format(new Date(member.joined_at), 'MMMM d, yyyy') : 'March 12, 2018'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Users className="h-4 w-4 text-[#2B3481] mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">Departments & Roles:</span>
                                            {assignments && assignments.length > 0 ? (
                                                <div className="flex flex-col mt-1 space-y-1">
                                                    {assignments.map((a, idx) => (
                                                        <span key={idx} className="leading-tight">
                                                            {a.role.charAt(0).toUpperCase() + a.role.slice(1)} - {(a.group as any).ministry.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">No department active</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <BookOpen className="h-4 w-4 text-[#2B3481] mt-0.5" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">Small Groups:</span>
                                            {assignments && assignments.length > 0 ? (
                                                <div className="flex flex-col mt-1 space-y-1">
                                                    {assignments.map((a, idx) => (
                                                        <span key={idx} className="leading-tight">
                                                            {(a.group as any).name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic">No assigned groups</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3 px-2">
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => contactActions.call()}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone className="h-4 w-4" /> Call
                                </Button>
                                <Button 
                                    onClick={() => contactActions.messageSMS()}
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-12 font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="h-4 w-4" /> Text
                                </Button>
                            </div>
                            
                            <Button 
                                onClick={() => sendEmail({
                                    to: member?.profiles?.email,
                                    templateName: 'visitor_welcome',
                                    templateData: { firstName: member?.profiles?.first_name },
                                    visitor_id: member?.profiles?.id
                                })}
                                disabled={isSending || member?.journey_stage === 'member'}
                                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                                    member?.journey_stage === 'member' ? 'opacity-0 pointer-events-none hidden' : ''
                                }`}
                            >
                                {isSending ? 'SENDING...' : 'SEND WELCOME VIP SERIES'}
                            </Button>
                            
                            <Button onClick={() => setActiveTab('overview')} variant="outline" className="w-full border-slate-100 hover:bg-slate-50 rounded-xl h-10 font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                <Edit className="h-3.5 w-3.5 mr-2" /> View Detailed Log
                            </Button>
                        </div>
                    </div>

                    {/* Right Pane - Content Area */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors overflow-hidden relative">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            {/* Sticky Header with Tab Controls */}
                            <div className="px-8 pt-8 pb-4 bg-white dark:bg-slate-950 border-b border-slate-50 dark:border-white/5 z-30">
                                <div className="flex items-center justify-between w-full mb-4">
                                    <TabsList className="bg-slate-50 dark:bg-slate-900 border-none h-12 p-1.2 rounded-2xl shadow-inner">
                                        <TabsTrigger value="overview" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Timeline</TabsTrigger>
                                        <TabsTrigger value="journey" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Journey</TabsTrigger>
                                        <TabsTrigger value="giving" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Giving</TabsTrigger>
                                        <TabsTrigger value="tasks" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg transition-all">Tasks</TabsTrigger>
                                    </TabsList>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all" onClick={() => onOpenChange(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Content Body */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-32">
                                <TabsContent value="overview" className="mt-0 space-y-8 pb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Interaction History</h3>
                                        <div className="h-1 w-12 bg-indigo-600 rounded-full" />
                                    </div>
                                    
                                    {interactions?.length ? interactions.map((interaction, i) => (
                                        <motion.div 
                                            key={interaction.id} 
                                            initial={{ opacity: 0, y: 20 }} 
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group/item"
                                        >
                                            <Card className="p-8 rounded-[2.5rem] border-none bg-slate-50/50 dark:bg-slate-900/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all hover:shadow-xl hover:bg-white dark:hover:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 hover:ring-indigo-100/50">
                                                <div className="flex gap-6">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-50 dark:border-white/5 group-hover/item:bg-indigo-600 group-hover/item:text-white group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-300">
                                                        {interaction.interaction_type === 'email' ? <Mail className="h-7 w-7" /> : 
                                                         interaction.interaction_type === 'phone' ? <Phone className="h-7 w-7" /> :
                                                         interaction.interaction_type === 'text' ? <MessageSquare className="h-7 w-7" /> :
                                                         <Edit className="h-7 w-7" />}
                                                    </div>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                                    {interaction.interaction_type === 'email' ? 'Follow-up Email Dispatched' : 
                                                                     interaction.interaction_type === 'phone' ? 'Phone Outreach Logged' : 
                                                                     interaction.interaction_type === 'text' ? 'Direct SMS Communication' :
                                                                     'Engagement Note Added'}
                                                                </h4>
                                                                {i === 0 && <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase tracking-widest">Latest</Badge>}
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em]">{format(new Date(interaction.created_at), 'MMM d, h:mm a')}</span>
                                                        </div>
                                                        <div className="bg-white/80 dark:bg-slate-950/20 p-5 rounded-[1.5rem] border border-slate-100/50 dark:border-white/5 shadow-inner">
                                                            <p className="text-[14px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed italic pr-4">
                                                                "{interaction.content}"
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 pt-2">
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[9px] font-black text-indigo-600 uppercase">
                                                                {(interaction as any).author?.first_name?.[0] || 'C'}
                                                            </div>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                {(interaction as any).author ? `${(interaction as any).author.first_name} ${(interaction as any).author.last_name || ''}` : 'CHURCH OFFICE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )) : (
                                        <div className="py-24 text-center opacity-20">
                                            <Activity className="h-12 w-12 mx-auto mb-6 text-slate-300" />
                                            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting First Interaction</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="journey" className="mt-0 space-y-8 pb-10">
                                     <div className="p-10 bg-indigo-600 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-indigo-200 dark:shadow-none">
                                        <SparklesIcon className="absolute -right-8 -top-8 w-48 h-48 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">Assimilation Pipeline</p>
                                            <h3 className="text-5xl font-black tracking-tighter uppercase mb-6 drop-shadow-sm">{member?.journey_stage?.replace(/_/g, ' ') || 'DISCOVERY'}</h3>
                                            <div className="flex gap-3">
                                                <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase h-7 px-4">VIP ONBOARDING</Badge>
                                                <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase h-7 px-4">READY FOR GROWTH</Badge>
                                            </div>
                                        </div>
                                     </div>

                                     <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Spiritual Milestones</h4>
                                            <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50"><PlusCircle className="h-4 w-4 mr-2" /> RECORD EVENT</Button>
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
                                                <div className="p-16 border-4 border-dashed border-slate-50 rounded-[3rem] text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">No milestones recorded yet</div>
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
                                        <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-none flex flex-col justify-between h-40 shadow-xl shadow-slate-200 dark:shadow-none">
                                            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Consistency</p>
                                            <h4 className="text-4xl font-black tracking-tighter">{donations?.length || 0} CONTRIBUTIONS</h4>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] px-2 text-center">Financial Records</h4>
                                        <div className="space-y-3">
                                            {donations?.map(d => (
                                                <div key={d.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-transparent hover:border-emerald-100 transition-all group">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><CircleDollarSign className="h-6 w-6 text-emerald-600" /></div>
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{d.category}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(d.donation_date), 'MMM d, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-black text-emerald-600 text-xl tracking-tighter">+${Number(d.amount).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            {(!donations || donations.length === 0) && (
                                                <div className="py-24 text-center opacity-20"><CircleDollarSign className="h-12 w-12 mx-auto mb-6 text-slate-300" /><p className="font-black uppercase tracking-[0.3em] text-[10px]">No financial history found</p></div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="tasks" className="mt-0 pb-10">
                                    <div className="p-20 border-4 border-dashed border-slate-50 rounded-[4rem] flex flex-col items-center justify-center text-center opacity-40">
                                        <ClipboardList className="h-12 w-12 mb-6" />
                                        <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-3">Outreach Intelligence</h4>
                                        <p className="text-[11px] font-bold max-w-[240px] leading-relaxed italic">Assign pastoral follow-ups or administrative tasks for this individual.</p>
                                        <Button disabled className="mt-10 bg-slate-200 text-slate-400 rounded-2xl h-12 px-10 font-black text-[10px] uppercase tracking-widest">Coming in V2</Button>
                                    </div>
                                </TabsContent>
                            </div>

                            {/* Note Input - Floating/Sticky at Bottom - Only on Overview */}
                            {activeTab === 'overview' && (
                                <div className="absolute bottom-0 left-0 right-0 p-8 pt-10 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent z-40 pointer-events-none">
                                    <div className="max-w-3xl mx-auto space-y-4 pointer-events-auto">
                                        <div className="relative group">
                                            <div className="absolute -top-3 left-6 px-3 bg-white dark:bg-slate-950">
                                                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Engagement Log</Label>
                                            </div>
                                            <Textarea 
                                                id="crm-note-field"
                                                placeholder="Note pastoral outcomes or prayer points..." 
                                                value={newCRMNote}
                                                onChange={e => setNewCRMNote(e.target.value)}
                                                className="min-h-[100px] rounded-[1.8rem] border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/80 p-6 font-bold text-slate-700 dark:text-white placeholder:text-slate-300 transition-all resize-none shadow-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 pr-20"
                                            />
                                            <Button 
                                                disabled={!newCRMNote.trim() || isSending}
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
                            )}
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MemberCRMDialog;
