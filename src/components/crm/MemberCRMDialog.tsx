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

                        <div className="mt-8 space-y-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full bg-[#353D8C] hover:bg-[#2B3481] text-white rounded-xl h-14 font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                        <MessageSquare className="h-5 w-5" /> Message
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px] rounded-2xl p-2 shadow-2xl border-none">
                                    <DropdownMenuItem onClick={contactActions.messageEmail} className="gap-3 p-4 cursor-pointer rounded-xl font-bold">
                                        <Mail className="h-5 w-5 text-[#353D8C]" /> Send Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={contactActions.messageSMS} className="gap-3 p-4 cursor-pointer rounded-xl font-bold">
                                        <MessageSquare className="h-5 w-5 text-[#353D8C]" /> Send SMS / Text
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={contactActions.call} className="w-full bg-[#353D8C] hover:bg-[#2B3481] text-white rounded-xl h-14 font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                <Phone className="h-5 w-5" /> Call
                            </Button>
                            <Button onClick={() => document.getElementById('crm-note-field')?.focus()} className="w-full bg-[#353D8C] hover:bg-[#2B3481] text-white rounded-xl h-14 font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                <Edit className="h-5 w-5" /> Log Note
                            </Button>
                        </div>
                    </div>

                    {/* Right Pane - Interaction Timeline */}
                    <div className="flex-1 flex flex-col bg-white transition-colors overflow-hidden">
                        <div className="p-8 pb-4 flex items-center justify-between sticky top-0 z-20 bg-white">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Interaction Timeline</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100" onClick={() => onOpenChange(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-6 custom-scrollbar">
                            {interactions?.length ? interactions.map((interaction, i) => {
                                const showDateSeparator = i === 0 || 
                                    format(new Date(interactions[i-1].created_at), 'yyyy-MM-dd') !== 
                                    format(new Date(interaction.created_at), 'yyyy-MM-dd');

                                return (
                                    <div key={interaction.id} className="relative flex flex-col">
                                        {/* Date Separator */}
                                        {showDateSeparator && (
                                            <div className="flex items-center gap-6 my-6 opacity-60">
                                                <div className="flex-1 h-[1px] bg-slate-300" />
                                                <span className="text-xs font-bold text-slate-500 tracking-wide">
                                                    {format(new Date(interaction.created_at), 'MMMM d, yyyy')}
                                                </span>
                                                <div className="flex-1 h-[1px] bg-slate-300" />
                                            </div>
                                        )}

                                        <Card className="p-7 rounded-2xl border border-slate-100 bg-white dark:bg-slate-900 shadow-sm relative group hover:shadow-md transition-all">
                                            <div className="flex gap-6">
                                                <div className="w-14 h-14 rounded-full bg-[#353D8C] flex items-center justify-center shrink-0 shadow-inner">
                                                    {interaction.interaction_type === 'email' ? <Mail className="h-6 w-6 text-white" /> : 
                                                     interaction.interaction_type === 'note' ? <Edit className="h-6 w-6 text-white" /> : 
                                                     interaction.interaction_type === 'phone' ? <Phone className="h-6 w-6 text-white" /> :
                                                     interaction.interaction_type === 'text' ? <MessageSquare className="h-6 w-6 text-white" /> :
                                                     <Calendar className="h-6 w-6 text-white" />}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                        {interaction.interaction_type === 'email' ? 'Email Sent' : 
                                                         interaction.interaction_type === 'note' ? 'Note Added' : 
                                                         interaction.interaction_type === 'text' ? '"Text Message"' :
                                                         interaction.interaction_type === 'phone' ? 'Call Logged' : 'Meeting Held'}
                                                    </h4>
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-900 dark:text-white">
                                                            <span className="font-black">Date:</span> <span className="font-medium text-slate-600 ml-1">{format(new Date(interaction.created_at), 'MMMM d, yyyy - h:mm a')}</span>
                                                        </p>
                                                        <p className="text-sm text-slate-900 dark:text-white">
                                                            <span className="font-black">Description:</span> <span className="font-medium text-slate-600 block mt-1 leading-relaxed">
                                                                {interaction.content}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-50 mt-4 italic">
                                                            <span className="font-black not-italic">{interaction.interaction_type === 'email' ? 'Sent by: ' : 
                                                                  interaction.interaction_type === 'text' ? 'Sent by: ' : 'Added by: '}</span>
                                                            <span className="font-bold text-[#353D8C] ml-1">
                                                                {(interaction as any).author ? `${(interaction as any).author.first_name} ${(interaction as any).author.last_name || ''}` : 'Church Office'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                    <Activity className="h-16 w-16 mb-4 text-slate-400" />
                                    <p className="font-black text-xs text-slate-500 uppercase tracking-widest">No active timeline history</p>
                                </div>
                            )}
                        </div>

                        {/* Note Input */}
                        <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">
                            <div className="max-w-3xl mx-auto space-y-4">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Engagement Log</Label>
                                <div className="relative group">
                                    <Textarea 
                                        id="crm-note-field"
                                        placeholder="Note pastoral outcomes or prayer points..." 
                                        value={newCRMNote}
                                        onChange={e => setNewCRMNote(e.target.value)}
                                        className="min-h-[120px] rounded-2xl border-transparent bg-slate-100 dark:bg-slate-900/50 p-6 font-bold text-slate-700 placeholder:text-slate-400 transition-all resize-none shadow-inner focus:bg-white focus:border-[#353D8C] focus:ring-4 focus:ring-[#353D8C]/5"
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
                                        className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-[#353D8C] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Send className="h-5 w-5" />
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
