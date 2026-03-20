import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Activity, Mail, MessageSquare, Phone, Edit, ArrowUpRight, 
  BookOpen, Clock, CheckCircle2, AlertCircle, Trash2, Send, 
  Zap, X, ShieldCheck, UserPlus, Calendar, ChevronRight,
  MapPin, Briefcase, Heart, Users
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
    const { interactions, addInteraction, isSending } = useVisitorInteractions(member?.profiles?.id);
    
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

    const contactActions = {
        message: () => window.location.href = `mailto:${member?.profiles?.email}`,
        call: () => window.location.href = `tel:${member?.profiles?.phone || ''}`,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-[#F8F9FA] dark:bg-slate-950">
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Pane - Member Profile */}
                    <div className="w-1/3 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 p-8 flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Member Profile</h3>
                        
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
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Church Details</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Calendar className="h-4 w-4 text-indigo-600" />
                                        <span>Member Since: {member?.joined_at ? format(new Date(member.joined_at), 'MMMM d, yyyy') : 'No date recorded'}</span>
                                    </div>
                                    
                                    {assignments?.some(a => (a.group as any).ministry.name.toLowerCase().includes('serving') || a.role.toLowerCase().includes('volunteer')) ? (
                                        <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <Users className="h-4 w-4 text-indigo-600 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">Serving Group:</p>
                                                <p>{assignments.find(a => (a.group as any).ministry.name.toLowerCase().includes('serving'))?.group?.name || 'Assigned'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 text-sm text-slate-400">
                                            <Users className="h-4 w-4 mt-0.5 opacity-50" />
                                            <p className="italic">Not in a serving team</p>
                                        </div>
                                    )}

                                    {assignments?.some(a => (a.group as any).ministry.name.toLowerCase().includes('life') || (a.group as any).ministry.name.toLowerCase().includes('small')) ? (
                                        <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <Heart className="h-4 w-4 text-indigo-600 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">Life Group:</p>
                                                <p>{assignments.find(a => (a.group as any).ministry.name.toLowerCase().includes('life') || (a.group as any).ministry.name.toLowerCase().includes('small'))?.group?.name}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 text-sm text-slate-400">
                                            <Heart className="h-4 w-4 mt-0.5 opacity-50" />
                                            <p className="italic">Not in a small group</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button onClick={contactActions.message} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-sm flex items-center justify-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Message
                            </Button>
                            <Button onClick={contactActions.call} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-sm flex items-center justify-center gap-2">
                                <Phone className="h-4 w-4" /> Call
                            </Button>
                            <Button onClick={() => document.getElementById('crm-note-field')?.focus()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-sm flex items-center justify-center gap-2">
                                <Edit className="h-4 w-4" /> Log Note
                            </Button>
                            <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest mt-2 h-8">
                                Configuration
                            </Button>
                        </div>
                    </div>

                    {/* Right Pane - Interaction Timeline */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-8 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-950/80 sticky top-0 z-20">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Interaction Timeline</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full" onClick={() => onOpenChange(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {interactions?.length ? interactions.map((interaction, i) => (
                                <div key={interaction.id} className="relative flex flex-col">
                                    {/* Date Divider */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {format(new Date(interaction.created_at), 'MMMM d, yyyy')}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>

                                    <Card className="p-6 rounded-xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-sm relative group hover:shadow-md transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                                {interaction.interaction_type === 'email' ? <Mail className="h-5 w-5 text-white" /> : 
                                                 interaction.interaction_type === 'note' ? <Edit className="h-5 w-5 text-white" /> : 
                                                 <Phone className="h-5 w-5 text-white" />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                    {interaction.interaction_type === 'email' ? 'Email Sent' : 
                                                     interaction.interaction_type === 'note' ? 'Note Added' : 'Call Logged'}
                                                </h4>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        Date: <span className="font-medium text-slate-600">{format(new Date(interaction.created_at), 'MMMM d, yyyy - h:mm a')}</span>
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        Description: <span className="font-medium text-slate-600 mb-1 block mt-1 leading-relaxed">
                                                            {interaction.content}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white pt-1">
                                                        {interaction.interaction_type === 'email' ? 'Sent by: ' : 'Added by: '}
                                                        <span className="font-medium text-slate-600">{(interaction as any).author?.first_name || 'Staff Member'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-32 opacity-30">
                                    <BookOpen className="h-12 w-12 mb-4 text-slate-400" />
                                    <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">No interactions recorded</p>
                                </div>
                            )}
                        </div>

                        {/* Note Input */}
                        <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-white/5">
                            <div className="max-w-3xl mx-auto space-y-4">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Rapid Insight Log</Label>
                                <div className="relative">
                                    <Textarea 
                                        id="crm-note-field"
                                        placeholder="Note pastoral outcomes or prayer points..." 
                                        value={newCRMNote}
                                        onChange={e => setNewCRMNote(e.target.value)}
                                        className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50 dark:bg-slate-900/50 p-5 font-medium placeholder:text-slate-400 transition-all resize-none shadow-inner"
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
                                        className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MemberCRMDialog;
