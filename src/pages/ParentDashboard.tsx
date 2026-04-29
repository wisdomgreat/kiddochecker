import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Baby,
  Clock,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Plus,
  Star,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Heart
} from "lucide-react";
import { useAuth } from "@/context/CleanAuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import RoleGuard from "@/components/security/RoleGuard";
import { cn } from "@/lib/utils";

interface ParentChild {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  allergies: string | null;
  medical_info: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["parent-own-children", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
      if (error) throw error;
      return (data as ParentChild[]) || [];
    },
    enabled: !!user?.id,
  });

  const { data: recentAttendance = [] } = useQuery({
    queryKey: ["parent-attendance-stream", user?.id],
    queryFn: async () => {
      if (!user?.id || children.length === 0) return [];
      const childIds = children.map((child: any) => child.id);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          child_id,
          attendance_date,
          checked_in_at,
          checked_out_at,
          children (first_name, last_name)
        `)
        .in('child_id', childIds)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && children.length > 0,
  });

  const { data: recentMessages = [] } = useQuery({
    queryKey: ["parent-messages-stream", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const streamItems = [
    ...recentAttendance.map(a => ({ ...a, type: 'attendance', timestamp: a.checked_in_at || a.attendance_date })),
    ...recentMessages.map(m => ({ ...m, type: 'message', timestamp: m.created_at }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();

  return (
    <RoleGuard requireParentAccess>
      <ModernLayout>
        <div className="max-w-[1400px] mx-auto space-y-12 pb-20 p-4 md:p-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-10 md:p-14 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm dark:shadow-2xl dark:shadow-black/40">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest">
                    Family Dashboard Active
                  </Badge>
                  <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tighter">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.user_metadata?.first_name || 'Parent'}</span>
                </h1>
                <p className="text-slate-500 text-lg font-bold max-w-xl leading-relaxed">
                  Your family's journey is secured. Monitor check-ins, communicate with staff, and manage your children's details in one unified environment.
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <Button size="lg" onClick={() => navigate('/parent/children')} className="h-16 px-10 rounded-3xl bg-slate-900 dark:bg-indigo-600 shadow-2xl shadow-slate-200 dark:shadow-indigo-500/20 hover:scale-105 transition-all text-sm font-bold uppercase tracking-widest text-white">
                  <Plus className="mr-3 h-5 w-5" />
                  Add Child
                </Button>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-card/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5">
                  <div className="h-10 w-10 bg-card dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm dark:shadow-black/20">
                     <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                     Encryption Active
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            
            <div className="xl:col-span-12 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-bold text-foreground dark:text-slate-100 tracking-tighter flex items-center gap-3">
                  <Baby className="h-8 w-8 text-indigo-600" />
                  Family Oversight
                </h2>
                <Button variant="ghost" className="font-bold text-[10px] uppercase tracking-[0.2em] text-indigo-600" onClick={() => navigate('/parent/children')}>
                  View Directory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {isLoadingChildren ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-64 bg-slate-100 rounded-[3rem] animate-pulse" />
                    ))
                  ) : children.length === 0 ? (
                    <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-20 text-center">
                       <Baby className="h-20 w-20 text-slate-300 mx-auto mb-6" />
                       <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">No Active Profiles</h3>
                       <p className="text-slate-500 font-bold mb-8">Initialize your children's profiles to begin check-in procedures.</p>
                       <Button onClick={() => navigate('/parent/children')} className="rounded-2xl h-14 px-8 bg-indigo-600 text-white">Start Digital Setup</Button>
                    </div>
                  ) : (
                    children.map((child: any, idx: number) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group"
                      >
                        <Card className="h-full border-none shadow-xl shadow-slate-100/50 dark:shadow-black/60 rounded-[3rem] overflow-hidden bg-card dark:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-500/10 transition-all cursor-pointer" onClick={() => navigate(`/parent/children?child=${child.id}`)}>
                          <CardContent className="p-10 space-y-6">
                            <div className="flex justify-between items-start">
                              <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-2xl dark:shadow-black/70">
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-2xl">
                                  {getInitials(child.first_name, child.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-bold text-[8px] uppercase tracking-tighter">
                                   ID: {child.id.split('-')[0]}
                                </Badge>
                                <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                              </div>
                            </div>

                            <div>
                              <h3 className="text-3xl font-bold text-foreground tracking-tighter">{child.first_name} {child.last_name}</h3>
                              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                                {child.age ? `${child.age} Years Old` : 'Age Unconfigured'}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                               {child.allergies && (
                                 <Badge variant="destructive" className="rounded-full text-[9px] font-bold px-3 py-1 bg-rose-50 text-rose-600 border-rose-100">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> ALLERGIES
                                 </Badge>
                               )}
                               <Badge className="rounded-full text-[9px] font-bold px-3 py-1 bg-indigo-50 text-indigo-600 border-indigo-100">
                                  <Clock className="h-3 w-3 mr-1" /> DAILY ACTIVE
                               </Badge>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Digital Snapshot</span>
                               <Button size="icon" variant="ghost" className="rounded-2xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="xl:col-span-8 space-y-8">
               <h2 className="text-3xl font-bold text-foreground tracking-tighter flex items-center gap-3 px-2 pt-10">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                  Living Stream
               </h2>
               
               <div className="bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-xl shadow-slate-100/50 dark:shadow-black/60">
                  <div className="p-10 space-y-1">
                     {streamItems.length === 0 ? (
                       <div className="py-24 text-center opacity-40">
                          <Star className="h-10 w-10 mx-auto mb-4 text-slate-300" />
                          <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting First Entry</p>
                       </div>
                     ) : (
                       streamItems.map((item: any, idx: number) => (
                         <motion.div 
                           key={item.id}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           className={cn(
                             "flex items-center gap-10 p-8 rounded-[2rem] transition-all group",
                             "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                           )}
                         >
                            <div className="relative shrink-0">
                               <div className={cn(
                                 "h-16 w-16 rounded-3xl flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg dark:shadow-black/60",
                                 item.type === 'attendance' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                               )}>
                                  {item.type === 'attendance' ? <Clock className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
                               </div>
                               <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white bg-slate-900 flex items-center justify-center">
                                  <ArrowRight className="h-2 w-2 text-white rotate-45" />
                               </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-bold text-foreground tracking-tight text-lg">
                                     {item.type === 'attendance' ? 
                                       `Check-in Log: ${item.children?.first_name}` : 
                                       `Protocol: ${item.subject || 'Incoming Transmission'}`}
                                  </h4>
                                  <Badge className="bg-slate-100 text-slate-400 border-none font-bold text-[8px] uppercase tracking-widest">
                                     {item.type}
                                  </Badge>
                               </div>
                               <p className="text-slate-500 font-bold truncate pr-10">
                                  {item.type === 'attendance' ? 
                                    `Successful entry recorded for ${item.children?.first_name} ${item.children?.last_name}` : 
                                    item.content}
                               </p>
                            </div>
                            
                            <div className="text-right hidden sm:block">
                               <p className="text-xs font-bold text-foreground tracking-tighter">
                                  {format(new Date(item.timestamp), "MMM dd, yyyy")}
                                </p>
                               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                  {format(new Date(item.timestamp), "h:mm a")}
                               </p>
                            </div>
                            
                            <Button size="icon" variant="ghost" className="rounded-2xl h-12 w-12 opacity-0 group-hover:opacity-100 transition-all" onClick={() => navigate(item.type === 'message' ? '/parent/messages' : '/parent/children')}>
                               <ChevronRight className="h-5 w-5" />
                            </Button>
                         </motion.div>
                       ))
                     )}
                  </div>
                  {streamItems.length > 5 && (
                    <div className="bg-slate-50/50 dark:bg-card/5 p-6 border-t border-slate-100 dark:border-white/5 text-center">
                       <Button variant="ghost" className="font-bold text-[10px] uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 hover:bg-card dark:hover:bg-slate-800" onClick={() => navigate('/parent/messages')}>
                          Load Full Communication History
                       </Button>
                    </div>
                  )}
               </div>
            </div>

            <div className="xl:col-span-4 space-y-8">
               <h2 className="text-3xl font-bold text-foreground dark:text-slate-100 tracking-tighter flex items-center gap-3 px-2 pt-10">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  Metrics
               </h2>
               
               <div className="grid grid-cols-1 gap-6">
                  <Card className="border-none shadow-xl shadow-slate-100/50 dark:shadow-black/60 rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="h-24 w-24" />
                     </div>
                     <CardContent className="p-10 space-y-2 relative z-10">
                        <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-widest leading-tight">Total Managed Lives</p>
                        <h4 className="text-6xl font-bold tracking-tighter">{children.length}</h4>
                        <div className="pt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                           All systems operational
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="border-none shadow-xl shadow-slate-100/50 dark:shadow-black/60 rounded-[2.5rem] bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-100/20 dark:hover:shadow-indigo-500/10">
                     <CardContent className="p-10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                              <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Response Required</p>
                              <h4 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tighter">
                                 {recentMessages.filter(m => !m.is_read).length} Unread
                              </h4>
                           </div>
                        </div>
                        <Button className="w-full rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 text-foreground dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold" onClick={() => navigate('/parent/messages')}>
                           Enter Inbox
                        </Button>
                     </CardContent>
                  </Card>

                  <Card className="border-none shadow-xl shadow-slate-100/50 dark:shadow-black/60 rounded-[2.5rem] bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-100/20 dark:hover:shadow-emerald-500/10">
                     <CardContent className="p-10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Events Active</p>
                              <h4 className="text-2xl font-bold text-foreground dark:text-slate-100 tracking-tighter">
                                 Check Schedule
                              </h4>
                           </div>
                        </div>
                        <Button className="w-full rounded-2xl h-14 bg-slate-50 dark:bg-slate-800 text-foreground dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold" onClick={() => navigate('/events')}>
                           View Events
                        </Button>
                     </CardContent>
                  </Card>
               </div>
            </div>

          </div>
        </div>
      </ModernLayout>
    </RoleGuard>
  );
};

export default ParentDashboard;

