import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { MessageSquare, Plus, Send, Inbox, Users, Bell, Clock, Search, Reply, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const MessagesManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    recipient_type: 'all'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendMessage({
        subject: formData.subject || "No Subject",
        content: formData.content,
        recipient_role: formData.recipient_type !== 'all' ? formData.recipient_type : 'all'
      });
      setIsDialogOpen(false);
      setFormData({ subject: '', content: '', recipient_type: 'all' });
    } catch (error) {
       // Error handled by hook
    }
  };

  const handleReply = (message: any) => {
    setFormData({
      subject: message.subject?.startsWith("Re:") ? message.subject : `Re: ${message.subject || "Message"}`,
      content: `\n\n--- Original Message ---\n${message.content}`,
      recipient_type: 'all'
    });
    setIsDialogOpen(true);
  };

  const filteredMessages = messages.filter(m => 
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inboxMessages = filteredMessages.filter(m => m.recipient_id === user?.id || (m.recipient_role && m.sender_id !== user?.id));
  const sentMessages = filteredMessages.filter(m => m.sender_id === user?.id);

  return (
    <ModernLayout>
      <div className="space-y-12 max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-foreground dark:text-white tracking-tighter uppercase italic leading-none">Intelligence</h1>
            <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Communication Hub</p>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">{messages.length} ACTIVE THREADS</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-[1.5rem] font-bold uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 gap-3"
                    >
                        <Sparkles className="h-5 w-5" />
                        New Broadcast
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-card dark:bg-slate-900 border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden">
                    <div className="p-10 bg-indigo-600 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold uppercase italic tracking-tight">Create Dispatch</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Broadcast to specific roles or everyone</p>
                            </div>
                            <Send className="h-12 w-12 opacity-20" />
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-card/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    </div>
                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label htmlFor="recipient_type" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Audience</Label>
                                <Select value={formData.recipient_type} onValueChange={(val) => setFormData({ ...formData, recipient_type: val })}>
                                    <SelectTrigger className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                        <SelectItem value="all" className="rounded-xl font-bold">Everyone (All Users)</SelectItem>
                                        <SelectItem value="parents" className="rounded-xl font-bold">Parents Only</SelectItem>
                                        <SelectItem value="staff" className="rounded-xl font-bold">Staff & Admins</SelectItem>
                                        <SelectItem value="teachers" className="rounded-xl font-bold">Teachers Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject / Header</Label>
                                <Input
                                    id="subject"
                                    placeholder="Enter subject..."
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold focus:ring-2 ring-indigo-500/20"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="content" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Compose your communication..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={8}
                                className="bg-slate-50 dark:bg-card/5 border-none rounded-2xl p-6 font-bold focus:ring-2 ring-indigo-500/20 resize-none min-h-[200px]"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                Discard
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-indigo-100 min-w-[200px]">
                                Send Dispatch
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Sidebar / Filters */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="lg:col-span-3 space-y-8"
           >
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                    placeholder="Search threads..." 
                    className="h-14 pl-14 bg-card dark:bg-slate-900 border-none rounded-[1.5rem] font-bold shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-4 ring-indigo-500/10 placeholder:text-slate-300 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="bg-card dark:bg-slate-900 rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col gap-2">
                 <button 
                   onClick={() => setActiveTab("inbox")}
                   className={cn("h-14 px-6 rounded-2xl flex items-center justify-between group transition-all duration-300", 
                     activeTab === "inbox" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "hover:bg-slate-50 dark:hover:bg-card/5 text-slate-500")}
                 >
                    <div className="flex items-center gap-4">
                        <Inbox className={cn("h-5 w-5", activeTab === "inbox" ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Inbox</span>
                    </div>
                    {inboxMessages.filter(m => !m.is_read).length > 0 && (
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", 
                          activeTab === "inbox" ? "bg-card text-indigo-600" : "bg-indigo-600 text-white")}>
                            {inboxMessages.filter(m => !m.is_read).length}
                        </div>
                    )}
                 </button>
                 <button 
                   onClick={() => setActiveTab("sent")}
                   className={cn("h-14 px-6 rounded-2xl flex items-center justify-between group transition-all duration-300", 
                     activeTab === "sent" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "hover:bg-slate-50 dark:hover:bg-card/5 text-slate-500")}
                 >
                    <div className="flex items-center gap-4">
                        <Send className={cn("h-5 w-5", activeTab === "sent" ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Dispatched</span>
                    </div>
                 </button>
                 <button 
                   onClick={() => setActiveTab("broadcast")}
                   className={cn("h-14 px-6 rounded-2xl flex items-center justify-between group transition-all duration-300", 
                     activeTab === "broadcast" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "hover:bg-slate-50 dark:hover:bg-card/5 text-slate-500")}
                 >
                    <div className="flex items-center gap-4">
                        <Bell className={cn("h-5 w-5", activeTab === "broadcast" ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Templates</span>
                    </div>
                 </button>
              </div>

              <div className="p-8 bg-indigo-50 dark:bg-indigo-600/10 rounded-[2.5rem] space-y-4">
                  <div className="w-12 h-12 bg-card dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-foreground dark:text-white uppercase tracking-tight">Need Support?</h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">System-wide messages are monitored for compliance and safety.</p>
              </div>
           </motion.div>

           {/* Conversation List */}
           <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                 {activeTab === "inbox" && (
                   <motion.div 
                     key="inbox" 
                     variants={containerVariants} initial="hidden" animate="show" exit="hidden"
                     className="space-y-6"
                   >
                     {inboxMessages.length === 0 ? (
                       <div className="bg-slate-50 dark:bg-card/5 rounded-[3rem] p-24 text-center border-4 border-dashed border-white dark:border-white/5">
                          <MessageSquare className="h-16 w-16 mx-auto mb-6 text-slate-200" />
                          <p className="font-bold text-slate-400 uppercase tracking-widest">Inbox is currently empty</p>
                       </div>
                     ) : (
                       inboxMessages.map((message) => (
                         <motion.div 
                           key={message.id} variants={itemVariants}
                           className={cn("bg-card dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 group relative overflow-hidden", 
                             !message.is_read && "ring-2 ring-indigo-500/20")}
                         >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                               <div className="space-y-4 flex-1">
                                  <div className="flex items-center gap-3">
                                      <h3 className="text-2xl font-bold text-foreground dark:text-white tracking-tighter italic uppercase underline decoration-indigo-200 underline-offset-8">
                                        {message.subject || "No Subject"}
                                      </h3>
                                      <div className="flex gap-2">
                                        {!message.is_read && <Badge className="bg-indigo-600 text-white font-bold text-[9px] px-3 h-6 tracking-widest uppercase animate-pulse">New Dispatch</Badge>}
                                        {message.is_broadcast && <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[9px] px-3 h-6 tracking-widest uppercase">Broadcast</Badge>}
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                              {message.sender?.first_name?.[0]}
                                          </div>
                                          <span className="text-foreground dark:text-white">{message.sender?.first_name} {message.sender?.last_name}</span>
                                      </div>
                                      <span className="opacity-30">•</span>
                                      <div className="flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          {format(new Date(message.created_at), "MMM d, h:mm a")}
                                      </div>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-card/5 rounded-[2rem] p-8 border border-slate-50 dark:border-white/5 shadow-inner">
                                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium text-lg italic tracking-tight italic">
                                          "{message.content}"
                                      </p>
                                  </div>
                               </div>
                               <div className="flex flex-row md:flex-col gap-3 shrink-0">
                                   {!message.is_read && (
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={() => markAsRead(message)}
                                         className="rounded-2xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-card/10"
                                       >
                                           Acknowledge
                                       </Button>
                                   )}
                                   <Button 
                                     size="sm" 
                                     onClick={() => handleReply(message)}
                                     className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 gap-2"
                                   >
                                       <Reply className="h-4 w-4" /> Reply
                                   </Button>
                               </div>
                            </div>
                            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-50 dark:bg-indigo-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                         </motion.div>
                       ))
                     )}
                   </motion.div>
                 )}

                 {activeTab === "sent" && (
                   <motion.div 
                     key="sent" 
                     variants={containerVariants} initial="hidden" animate="show" exit="hidden"
                     className="space-y-6"
                   >
                     {sentMessages.length === 0 ? (
                       <div className="bg-slate-50 dark:bg-card/5 rounded-[3rem] p-24 text-center border-4 border-dashed border-white dark:border-white/5">
                          <Send className="h-16 w-16 mx-auto mb-6 text-slate-200" />
                          <p className="font-bold text-slate-400 uppercase tracking-widest">No sent messages yet</p>
                       </div>
                     ) : (
                       sentMessages.map(msg => (
                         <motion.div 
                           key={msg.id} variants={itemVariants}
                           className="bg-card dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none"
                         >
                            <div className="flex justify-between items-start mb-6">
                               <div className="space-y-2">
                                  <h4 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight leading-none">{msg.subject}</h4>
                                  <div className="flex items-center gap-3">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent to:</p>
                                      <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-widest border-indigo-100 text-indigo-600">
                                          {msg.recipient_role ? `BROADCAST: ${msg.recipient_role}` : msg.recipient ? `${msg.recipient.first_name} ${msg.recipient.last_name}` : "All Recipients"}
                                      </Badge>
                                  </div>
                               </div>
                               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{format(new Date(msg.created_at), "MMM d, HH:mm")}</span>
                            </div>
                            <div className="bg-indigo-50/50 dark:bg-indigo-600/5 rounded-[2rem] p-8">
                                <p className="text-slate-500 italic font-medium leading-relaxed tracking-tight">"{msg.content}"</p>
                            </div>
                         </motion.div>
                       ))
                     )}
                   </motion.div>
                 )}

                 {activeTab === "broadcast" && (
                   <motion.div 
                     key="templates" 
                     variants={containerVariants} initial="hidden" animate="show" exit="hidden"
                     className="grid grid-cols-1 md:grid-cols-2 gap-8"
                   >
                     {[
                       { id: 'service', title: 'Service Update', icon: <Bell className="text-indigo-600" />, content: 'Please note that our service schedule has been updated.' },
                       { id: 'emergency', title: 'Emergency Alert', icon: <AlertCircle className="text-rose-600" />, content: 'Important safety information for all members.' },
                       { id: 'event', title: 'Event Reminder', icon: <Sparkles className="text-emerald-600" />, content: 'Don\'t forget about our upcoming event!' },
                       { id: 'weather', title: 'Weather Advisory', icon: <Bell className="text-amber-600" />, content: 'Inclement weather update: Stay tuned for potential delays.' },
                     ].map(tmpl => (
                       <motion.div key={tmpl.id} variants={itemVariants}>
                         <Card 
                           className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border-none p-10 cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col items-center text-center h-full"
                           onClick={() => {
                               setFormData({ subject: tmpl.title, content: tmpl.content, recipient_type: 'all' });
                               setIsDialogOpen(true);
                           }}
                         >
                            <div className="w-20 h-20 bg-slate-50 dark:bg-card/5 rounded-[2rem] flex items-center justify-center mb-6 transition-all group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                                {tmpl.icon}
                            </div>
                            <h3 className="text-xl font-bold text-foreground dark:text-white uppercase italic tracking-tight mb-2">{tmpl.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed mb-8">{tmpl.content}</p>
                            <Button variant="ghost" className="w-full h-12 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all gap-2">
                                Use Template <ChevronRight className="h-4 w-4" />
                            </Button>
                         </Card>
                       </motion.div>
                     ))}
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default MessagesManagement;
