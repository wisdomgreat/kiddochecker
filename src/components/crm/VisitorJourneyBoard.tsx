
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, MapPin, 
  ArrowRight, Phone, MessageSquare, MoreHorizontal, UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useMembers, ChurchMember } from '@/hooks/useMembers';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const JOURNEY_STAGES = [
  { id: 'initial_visit', name: 'First Visit', color: 'bg-orange-50 text-orange-600', icon: Clock },
  { id: 'followed_up', name: 'Followed Up', color: 'bg-blue-50 text-blue-600', icon: Phone },
  { id: 'connected', name: 'Connected', color: 'bg-indigo-50 text-indigo-600', icon: MessageSquare },
  { id: 'member', name: 'Active Member', color: 'bg-emerald-50 text-emerald-600', icon: UserCheck },
];

const VisitorJourneyBoard = () => {
    const { members, isLoading, updateJourneyStage } = useMembers();
    
    // Only show people who are in the integration stages (visitors or new regulars)
    const pipelineMembers = members.filter(m => 
        m.membership_type === 'visitor' || m.membership_type === 'regular' || m.journey_stage !== 'member'
    );

    if (isLoading) {
        return <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Initializing CRM Pipeline...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full min-h-[700px]">
            {JOURNEY_STAGES.map((stage) => (
                <div key={stage.id} className="flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", stage.color)}>
                                <stage.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{stage.name}</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    {pipelineMembers.filter(m => (m.journey_stage || 'initial_visit') === stage.id).length} Persons
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50/40 dark:bg-slate-900/40 rounded-[2.5rem] p-5 space-y-4 border border-slate-100 dark:border-white/5 min-h-[500px]">
                        {pipelineMembers
                          .filter(m => (m.journey_stage || 'initial_visit') === stage.id)
                          .map((member) => (
                            <motion.div 
                                key={member.id} 
                                layoutId={member.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group"
                            >
                                <Card className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {member.profiles?.first_name?.[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm">
                                                        {member.profiles?.first_name} {member.profiles?.last_name}
                                                    </h4>
                                                    <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                                                        {member.membership_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]">
                                                    <p className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Transition Stage</p>
                                                    {JOURNEY_STAGES.filter(s => s.id !== (member.journey_stage || 'initial_visit')).map(s => (
                                                        <DropdownMenuItem 
                                                            key={s.id} 
                                                            className="font-bold text-[10px] uppercase p-3 rounded-xl cursor-pointer flex items-center gap-2"
                                                            onClick={() => updateJourneyStage({ id: member.id, stage: s.id })}
                                                        >
                                                            <ArrowRight className="h-3 w-3" /> Move to {s.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl">
                                            <div className="flex gap-1.5">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:shadow-sm"><Phone className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:shadow-sm"><MessageSquare className="h-3.5 w-3.5" /></Button>
                                            </div>
                                            <Separator orientation="vertical" className="h-4" />
                                            <div className="flex-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        
                        {pipelineMembers.filter(m => (m.journey_stage || 'initial_visit') === stage.id).length === 0 && (
                            <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] opacity-20">
                                <span className="text-[8px] font-black uppercase tracking-widest">No Active Journeys</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VisitorJourneyBoard;
