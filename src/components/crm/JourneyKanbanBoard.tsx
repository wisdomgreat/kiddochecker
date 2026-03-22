
import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Users, CheckCircle2, Clock, AlertCircle, TrendingUp, 
  MessageSquare, Phone, MoreHorizontal, UserPlus 
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
import { useCRMManagement, EngagementTask } from '@/hooks/useCRMManagement';
import { useAuth } from '@/context/AuthContext';
import { useAllUsers } from '@/hooks/useAllUsers';
import { Separator } from '@/components/ui/separator';

const KANBAN_STAGES = [
  { id: 'todo', name: 'Backlog / New', color: 'bg-slate-100 text-slate-600', icon: Clock },
  { id: 'in_progress', name: 'In Outreach', color: 'bg-indigo-50 text-indigo-600', icon: TrendingUp },
  { id: 'done', name: 'Completed', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
];

const JourneyKanbanBoard = () => {
    const { tasks, tasksLoading, updateTaskStatus, assignTask } = useCRMManagement();
    const { data: allUsers } = useAllUsers();
    const { user } = useAuth();
    
    const staffMembers = allUsers?.filter(u => ['admin', 'super_admin', 'staff', 'teacher'].includes(u.role)) || [];

    if (tasksLoading) {
        return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Synchronizing Outreach Funnel...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full min-h-[600px]">
            {KANBAN_STAGES.map((stage) => (
                <div key={stage.id} className="flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${stage.color} flex items-center justify-center`}>
                                <stage.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{stage.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tasks.filter(t => t.status === stage.id).length} Active Items</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] p-6 space-y-4 border border-slate-100 dark:border-white/5 shadow-inner min-h-[500px]">
                        {tasks.filter(t => t.status === stage.id).map((task) => (
                            <motion.div 
                                key={task.id} 
                                layoutId={task.id}
                                className="group"
                            >
                                <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <Badge className={`
                                                ${task.priority === 'urgent' ? 'bg-rose-50 text-rose-600' : 
                                                  task.priority === 'high' ? 'bg-orange-50 text-orange-600' : 
                                                  'bg-slate-50 text-slate-500'} 
                                                text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-none
                                            `}>
                                                {task.priority} Priority
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 group-hover:text-slate-600 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2">
                                                    {KANBAN_STAGES.filter(s => s.id !== stage.id).map(s => (
                                                        <DropdownMenuItem 
                                                            key={s.id} 
                                                            className="font-bold text-xs uppercase p-3 rounded-lg cursor-pointer"
                                                            onClick={() => updateTaskStatus({ id: task.id, status: s.id })}
                                                        >
                                                            Move to {s.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <Separator className="my-2 bg-slate-100" />
                                                    <p className="text-[10px] font-black uppercase text-slate-400 px-3 py-1">Assign Outreach</p>
                                                    {staffMembers.map(staff => (
                                                        <DropdownMenuItem 
                                                            key={staff.id} 
                                                            className="text-xs p-3 rounded-lg cursor-pointer flex items-center gap-2"
                                                            onClick={() => assignTask({ id: task.id, assigned_to: staff.id })}
                                                        >
                                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[8px]">{staff.first_name?.[0]}</div>
                                                            <span className="font-bold">{staff.first_name} {staff.last_name}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1">{task.title}</h4>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{task.description}</p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                                                    {(task.member as any)?.profiles?.first_name?.[0]}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-900">{(task.member as any)?.profiles?.first_name} {(task.member as any)?.profiles?.last_name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"><Phone className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"><MessageSquare className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        {tasks.filter(t => t.status === stage.id).length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl opacity-20">
                                <Users className="h-8 w-8 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Clear Queue</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default JourneyKanbanBoard;
