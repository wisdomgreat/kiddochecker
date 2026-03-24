import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, MapPin, 
  ArrowRight, Phone, MessageSquare, MoreHorizontal, UserCheck,
  Star, Activity, TrendingUp, Heart
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
import MemberCRMDialog from './MemberCRMDialog';

const JOURNEY_STAGES = [
  { id: 'initial_visit', name: 'First Visit', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600', icon: Clock, accent: 'border-amber-200' },
  { id: 'followed_up', name: 'Followed Up', color: 'bg-sky-500', lightColor: 'bg-sky-50', textColor: 'text-sky-600', icon: Phone, accent: 'border-sky-200' },
  { id: 'connected', name: 'Connected', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600', icon: MessageSquare, accent: 'border-indigo-200' },
  { id: 'member', name: 'Active Member', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', icon: UserCheck, accent: 'border-emerald-200' },
];

const VisitorJourneyBoard = () => {
    const { members, isLoading, updateJourneyStage } = useMembers();
    const [selectedMember, setSelectedMember] = useState<ChurchMember | null>(null);
    const [isCRMOpen, setIsCRMOpen] = useState(false);
    
    const pipelineMembers = members.filter(m => 
        m.membership_type === 'visitor' || m.membership_type === 'regular' || m.journey_stage !== 'member'
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce">
                    <Heart className="h-8 w-8 text-indigo-600 animate-pulse" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Connecting with congregation...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex flex-nowrap lg:grid lg:grid-cols-4 gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent pr-4 -mr-4">
            {JOURNEY_STAGES.map((stage) => (
                    <div key={stage.id} className="flex flex-col gap-6 min-w-[280px] lg:min-w-0">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3">
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 ring-4 ring-white dark:ring-slate-900", stage.color)}>
                                <stage.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px]">{stage.name}</h3>
                                <div className="flex items-center gap-1.5 leading-none">
                                    <TrendingUp className="h-2.5 w-2.5 text-slate-300" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {pipelineMembers.filter(m => (m.journey_stage || 'initial_visit') === stage.id).length} Active
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column Body - Glassmorphism */}
                    <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-4 space-y-4 border border-white dark:border-white/10 shadow-inner min-h-[600px] transition-all duration-500 hover:bg-slate-200/70 dark:hover:bg-slate-900/80">
                        <AnimatePresence mode="popLayout">
                            {pipelineMembers
                              .filter(m => (m.journey_stage || 'initial_visit') === stage.id)
                              .map((member) => (
                                <motion.div 
                                    key={member.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    whileHover={{ y: -5 }}
                                    className="group"
                                    onClick={() => {
                                        setSelectedMember(member);
                                        setIsCRMOpen(true);
                                    }}
                                >
                                    <Card className={cn(
                                        "p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all cursor-pointer relative overflow-hidden group-hover:ring-2",
                                        stage.accent.replace('border-', 'ring-')
                                    )}>
                                        {/* Status Glow */}
                                        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 rounded-full", stage.color)} />
                                        
                                        <div className="flex flex-col gap-5 relative z-10">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all shadow-sm",
                                                        stage.lightColor, stage.textColor,
                                                        "group-hover:scale-110 group-hover:rotate-3"
                                                    )}>
                                                        {member.profiles?.first_name?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-slate-900 dark:text-white tracking-tight text-sm uppercase truncate leading-tight">
                                                            {member.profiles?.first_name} {member.profiles?.last_name}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className={cn("w-2 h-2 rounded-full animate-pulse shrink-0", stage.color)} />
                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">
                                                                {member.membership_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 rounded-full transition-colors shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[220px] bg-white dark:bg-slate-900">
                                                        <p className="text-[9px] font-black uppercase text-slate-400 px-3 py-2 tracking-[0.2em] border-b border-slate-50 dark:border-white/5 mb-2">Modern Journey Migration</p>
                                                        {JOURNEY_STAGES.map(s => (
                                                            <DropdownMenuItem 
                                                                key={s.id} 
                                                                disabled={s.id === (member.journey_stage || 'initial_visit')}
                                                                className={cn(
                                                                    "font-black text-[9px] uppercase p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all mb-1",
                                                                    s.id === (member.journey_stage || 'initial_visit') ? "opacity-30" : "hover:bg-slate-50 dark:hover:bg-white/5"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    updateJourneyStage({ id: member.id, stage: s.id });
                                                                }}
                                                            >
                                                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", s.lightColor)}>
                                                                    <s.icon className={cn("h-4 w-4", s.textColor)} />
                                                                </div>
                                                                Move to {s.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="bg-slate-50/80 dark:bg-white/5 p-4 rounded-[1.5rem] border border-white/50 dark:border-white/5 flex items-center justify-between gap-4">
                                                <div className="flex gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all hover:scale-110 active:scale-95 shrink-0"><Phone className="h-4 w-4" /></div>
                                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-sm transition-all hover:scale-110 active:scale-95 shrink-0"><MessageSquare className="h-4 w-4" /></div>
                                                </div>
                                                <div className="text-right min-w-0">
                                                    <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-0.5 truncate">Integration Date</p>
                                                    <p className="text-[10px] font-black text-slate-400 tabular-nums truncate">
                                                        {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                              ))}
                        </AnimatePresence>
                        
                        {pipelineMembers.filter(m => (m.journey_stage || 'initial_visit') === stage.id).length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[2.5rem] bg-slate-50/30"
                            >
                                <Activity className="h-5 w-5 text-slate-400 mb-2 opacity-20" />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Currently Balanced</span>
                            </motion.div>
                        )}
                    </div>
                </div>
                ))}
            </div>

            <MemberCRMDialog 
                member={selectedMember} 
                isOpen={isCRMOpen} 
                onOpenChange={setIsCRMOpen} 
            />
        </div>
    );
};

export default VisitorJourneyBoard;
