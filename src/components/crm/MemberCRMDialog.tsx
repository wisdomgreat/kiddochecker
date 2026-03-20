import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Activity, Mail, MessageSquare, Phone, Edit, ArrowUpRight, 
  BookOpen, Clock, CheckCircle2, AlertCircle, Trash2, Send, 
  Zap, X, ShieldCheck, UserPlus, Calendar, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVisitorInteractions, VisitorInteraction } from '@/hooks/useVisitorInteractions';

interface MemberCRMDialogProps {
  member: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberCRMDialog: React.FC<MemberCRMDialogProps> = ({ member, isOpen, onOpenChange }) => {
    const [newCRMNote, setNewCRMNote] = useState('');
    const { interactions, addInteraction, isSending } = useVisitorInteractions(member?.profiles?.id);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col h-[85vh] bg-white dark:bg-slate-950">
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Pane - Profile Details */}
                    <div className="w-1/3 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-white/5 p-10 flex flex-col items-center">
                        <div className="relative mb-8">
                            <Avatar className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-black">
                                    {member?.profiles?.first_name?.[0] || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase ring-4 ring-white dark:ring-slate-900 shadow-lg animate-pulse">
                                Active
                            </div>
                        </div>

                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic underline decoration-indigo-500/30 decoration-4">
                                {member?.profiles?.first_name} {member?.profiles?.last_name}
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                {member?.membership_type === 'visitor' ? 'First Time Visitor' : 
                                 member?.membership_type === 'regular' ? 'Regular Attendee' : 'Registered Member'}
                            </p>
                        </div>

                        <Separator className="w-full mb-8 bg-slate-200 dark:bg-white/10" />

                        <div className="w-full space-y-5">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> Communication
                                </p>
                                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate block">{member?.profiles?.email}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> Contact
                                </p>
                                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">{member?.profiles?.phone || 'No phone added'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto w-full space-y-3">
                            <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black italic tracking-tight shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Zap className="h-5 w-5" /> RE-ENGAGE
                            </Button>
                            <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Configuration</Button>
                        </div>
                    </div>

                    {/* Right Pane - Interaction Timeline */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl z-20">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 uppercase italic tracking-tighter decoration-indigo-500 decoration-double">
                                <Activity className="h-6 w-6 text-indigo-600 animate-pulse" /> Pastoral Care Journal
                            </h3>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-indigo-600 rounded-2xl" onClick={() => onOpenChange(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                            {interactions?.length ? interactions.map((interaction, i) => (
                                <div key={interaction.id} className="relative pl-14 flex flex-col group/item transition-all">
                                    {i !== interactions.length - 1 && (
                                        <div className="absolute left-[15px] top-12 bottom-[-48px] w-0.5 bg-slate-100 dark:bg-white/5" />
                                    )}
                                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-2xl z-10 flex items-center justify-center transition-all group-hover/item:scale-110">
                                        {interaction.interaction_type === 'email' ? <Mail className="h-4 w-4 text-indigo-500" /> : 
                                         interaction.interaction_type === 'note' ? <MessageSquare className="h-4 w-4 text-amber-500" /> : 
                                         <Activity className="h-4 w-4 text-emerald-500" />}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                                                {format(new Date(interaction.created_at), 'MMMM d, yyyy')}
                                            </span>
                                            <Badge className={`text-[9px] font-black px-3 py-0.5 uppercase tracking-tighter h-5 rounded-lg ${
                                                interaction.interaction_type === 'email' ? 'bg-indigo-50 text-indigo-600' : 
                                                interaction.interaction_type === 'note' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {interaction.interaction_type}
                                            </Badge>
                                        </div>
                                        <Card className="p-8 rounded-[2.5rem] rounded-tl-none border-none bg-slate-50 dark:bg-slate-900/40 shadow-sm relative group-hover/item:shadow-2xl transition-all group-hover/item:bg-white dark:group-hover/item:bg-slate-900 border border-transparent group-hover/item:border-slate-100 dark:group-hover/item:border-white/5">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                                "{interaction.content}"
                                            </p>
                                            {interaction.metadata?.template_name && (
                                                <div className="mt-5 flex items-center gap-3 px-4 py-2 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/20 w-fit">
                                                    <Zap className="h-3.5 w-3.5 text-indigo-600" />
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Workflow: {interaction.metadata.template_name}</span>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                                    <BookOpen className="h-14 w-14 mb-4" />
                                    <p className="font-black text-xs uppercase tracking-[0.3em] font-heading">Secure Ledger Empty</p>
                                </div>
                            )}
                        </div>

                        <div className="p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 z-20">
                            <div className="flex gap-6 items-end max-w-2xl mx-auto">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest px-2">Rapid Insight Log</Label>
                                    <Textarea 
                                        placeholder="Note pastoral outcomes or prayer points..." 
                                        value={newCRMNote}
                                        onChange={e => setNewCRMNote(e.target.value)}
                                        className="h-28 rounded-[2rem] border-none bg-slate-50 dark:bg-slate-900/50 shadow-inner px-8 py-5 font-medium focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-all resize-none"
                                    />
                                </div>
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
                                    className="h-16 w-16 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 dark:shadow-none flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-all group lg:mt-0 mt-8"
                                >
                                    <Send className="h-8 w-8 transition-transform group-hover:rotate-12" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MemberCRMDialog;
