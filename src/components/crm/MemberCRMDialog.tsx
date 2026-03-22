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
                                disabled={isSending}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            >
                                <SparklesIcon className="h-5 w-5" /> {isSending ? 'SENDING...' : 'SEND WELCOME VIP SERIES'}
                            </Button>
                            
                            <Button onClick={() => setActiveTab('overview')} variant="outline" className="w-full border-slate-100 hover:bg-slate-50 rounded-xl h-10 font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                <Edit className="h-3.5 w-3.5 mr-2" /> View Detailed Log
                            </Button>
                        </div>
                    </div>

                    {/* Right Pane - Content Area */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors overflow-hidden">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-30">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className="flex items-center justify-between w-full">
                                    <TabsList className="bg-slate-50 dark:bg-slate-900 border-none h-12 p-1 rounded-2xl">
                                        <TabsTrigger value="overview" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Timeline</TabsTrigger>
                                        <TabsTrigger value="journey" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Journey</TabsTrigger>
                                        <TabsTrigger value="giving" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Giving</TabsTrigger>
                                        <TabsTrigger value="tasks" className="rounded-xl px-6 font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Assign Tasks</TabsTrigger>
                                    </TabsList>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full" onClick={() => onOpenChange(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                <Separator className="mt-4 bg-slate-50" />

                                <div className="mt-6 flex-1 overflow-y-auto max-h-[calc(70vh)] pr-2 custom-scrollbar pb-20">
                                    <TabsContent value="overview" className="mt-0 space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Interaction History</h3>
                                        </div>
                                        {interactions?.length ? interactions.map((interaction, i) => (
                                            <motion.div 
                                                key={interaction.id} 
                                                initial={{ opacity: 0, x: -10 }} 
                                                animate={{ opacity: 1, x: 0 }}
                                                className="relative flex flex-col group/item"
                                            >
                                                <Card className="p-7 rounded-[2rem] border border-slate-100 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:scale-[1.01]">
                                                    <div className="flex gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                                            {interaction.interaction_type === 'email' ? <Mail className="h-6 w-6" /> : 
                                                             interaction.interaction_type === 'phone' ? <Phone className="h-6 w-6" /> :
                                                             interaction.interaction_type === 'text' ? <MessageSquare className="h-6 w-6" /> :
                                                             <Edit className="h-6 w-6" />}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                    {interaction.interaction_type === 'email' ? 'Follow-up Email Dispatched' : 
                                                                     interaction.interaction_type === 'phone' ? 'Phone Outreach Logged' : 
                                                                     interaction.interaction_type === 'text' ? 'Direct SMS Communication' :
                                                                     'Engagement Note Added'}
                                                                </h4>
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{format(new Date(interaction.created_at), 'MMM d, h:mm a')}</span>
                                                            </div>
                                                            <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl">
                                                                {interaction.content}
                                                            </p>
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                                    {(interaction as any).author?.first_name?.[0]}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {(interaction as any).author ? `${(interaction as any).author.first_name} ${(interaction as any).author.last_name || ''}` : 'CHURCH OFFICE'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        )) : (
                                            <div className="py-20 text-center opacity-20">
                                                <Activity className="h-10 w-10 mx-auto mb-4" />
                                                <p className="font-bold uppercase tracking-widest text-[10px]">No interactions found</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="journey" className="mt-0 space-y-8">
                                         <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white relative overflow-hidden group">
                                            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Integration Level</p>
                                                <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">{member?.journey_stage || 'DISCOVERY'}</h3>
                                                <div className="flex gap-2">
                                                    <Badge className="bg-white/20 text-white border-none font-bold">VIP ONBOARDING</Badge>
                                                    <Badge className="bg-white/20 text-white border-none font-bold">READY FOR GROWTH</Badge>
                                                </div>
                                            </div>
                                         </div>

                                         <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Spiritual Milestones</h4>
                                                <Button size="sm" variant="outline" className="h-8 rounded-lg border-indigo-100 text-indigo-600 font-bold text-xs"><PlusCircle className="h-3.5 w-3.5 mr-1" /> RECORD</Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                {milestones?.map(m => (
                                                    <div key={m.id} className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                                            <Trophy className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{m.milestone_type.replace(/_/g, ' ')}</h5>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(m.attained_at), 'MMMM yyyy')}</p>
                                                        </div>
                                                        {m.notes && <Badge variant="outline" className="opacity-40 text-[8px] font-bold">NOTED</Badge>}
                                                    </div>
                                                ))}
                                                {(!milestones || milestones.length === 0) && (
                                                    <div className="p-10 border-2 border-dashed rounded-3xl text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">No milestones verified yet</div>
                                                )}
                                            </div>
                                         </div>
                                    </TabsContent>

                                    <TabsContent value="giving" className="mt-0 space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="p-6 rounded-2xl bg-emerald-50 border-none flex flex-col justify-between h-32">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Lifetime Giving</p>
                                                <h4 className="text-3xl font-black text-emerald-700">${donations?.reduce((acc, d) => acc + Number(d.amount), 0).toLocaleString()}</h4>
                                            </Card>
                                            <Card className="p-6 rounded-2xl bg-slate-50 border-none flex flex-col justify-between h-32">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</p>
                                                <h4 className="text-3xl font-black text-slate-900">{donations?.length || 0} GIFTS</h4>
                                            </Card>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Financial Records</h4>
                                            <div className="space-y-3">
                                                {donations?.map(d => (
                                                    <div key={d.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CircleDollarSign className="h-5 w-5 text-emerald-600" /></div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white text-sm capitalize">{d.category}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(d.donation_date), 'MMM d, yyyy')}</p>
                                                            </div>
                                                        </div>
                                                        <p className="font-black text-emerald-600 text-lg">+${Number(d.amount).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                                {(!donations || donations.length === 0) && (
                                                    <div className="py-20 text-center opacity-20"><CircleDollarSign className="h-10 w-10 mx-auto mb-4" /><p className="font-bold uppercase tracking-widest text-[10px]">No giving history found</p></div>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="tasks" className="mt-0">
                                        <div className="p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
                                            <ClipboardList className="h-10 w-10 mb-4" />
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-2">Automated Outreach</h4>
                                            <p className="text-[10px] font-bold max-w-[200px]">Assign following-up tasks to specific staff members for this person.</p>
                                            <Button className="mt-6 bg-slate-900 text-white rounded-xl h-10 px-6 font-bold text-[10px] uppercase tracking-widest">Coming Soon</Button>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        {/* Note Input - Only on Overview */}
                        {activeTab === 'overview' && (
                            <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 mt-auto">
                                <div className="max-w-3xl mx-auto space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Engagement Log</Label>
                                    <div className="relative group">
                                        <Textarea 
                                            id="crm-note-field"
                                            placeholder="Note pastoral outcomes or prayer points..." 
                                            value={newCRMNote}
                                            onChange={e => setNewCRMNote(e.target.value)}
                                            className="min-h-[120px] rounded-[1.5rem] border-transparent bg-slate-50 dark:bg-slate-900/50 p-6 font-bold text-slate-700 placeholder:text-slate-400 transition-all resize-none shadow-inner focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5"
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
                                            className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Send className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MemberCRMDialog;
