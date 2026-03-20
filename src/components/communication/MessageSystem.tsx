import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMessages, type Message } from "@/hooks/useMessages";
import {
  MessageSquare,
  Send,
  Mail,
  Plus,
  Search,
  Clock,
  Check,
  ChevronsUpDown,
  Smartphone,
  Sparkles,
  MoreVertical,
  Paperclip,
  ChevronLeft,
  Users
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface MessageGroup {
  partnerId: string;
  latest: Message;
  unreadCount: number;
  partnerName: string;
  partnerRole: string;
  allMessages: Message[];
}

const MessageSystem = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    recipientId: "",
    sendViaSms: false,
    sendViaEmail: false
  });

  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = useMessages();

  useEffect(() => {
    const fetchRecipients = async () => {
      const { data, error } = await supabase.rpc('get_available_recipients');
      if (!error && data) {
        setUsers(data);
      } else {
        const { data: fallbackData } = await supabase
          .from('user_roles')
          .select('user_id, role, profiles:user_id (id, first_name, last_name, email)')
          .limit(100);
        if (fallbackData) {
          setUsers(fallbackData.map(d => ({
            id: d.user_id,
            role: d.role,
            first_name: (d.profiles as any)?.first_name || '',
            last_name: (d.profiles as any)?.last_name || '',
            email: (d.profiles as any)?.email || ''
          })));
        }
      }
    };
    fetchRecipients();
  }, []);

  const threads = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(msg => {
      let partnerId = "";
      if (msg.is_broadcast || msg.recipient_role) {
        partnerId = `role_${msg.recipient_role}`;
      } else {
        partnerId = msg.sender_id === user?.id ? (msg.recipient_id || "unknown") : msg.sender_id;
      }
      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });

    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    return groups;
  }, [messages, user?.id]);

  const inboxItems = useMemo(() => {
    return Object.entries(threads)
      .map(([partnerId, msgList]) => {
        const latest = msgList[msgList.length - 1];
        const unreadCount = msgList.filter(m => !m.is_read && m.recipient_id === user?.id).length;
        
        let partnerName = "Broadcast";
        let partnerRole = "";
        
        if (partnerId.startsWith('role_')) {
          partnerName = partnerId === 'role_all' ? 'Organization Wide' : `Team: ${partnerId.replace('role_', '')}`;
        } else {
          const partner = latest.sender_id === user?.id ? latest.recipient : latest.sender;
          partnerName = partner?.first_name ? `${partner.first_name} ${partner.last_name || ''}` : "Unknown User";
          partnerRole = partner?.role || "";
        }

        return { partnerId, latest, unreadCount, partnerName, partnerRole, allMessages: msgList };
      })
      .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
      .filter(item => 
        item.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.latest.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [threads, searchQuery, user?.id]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedPartnerId) return;
    const thread = threads[selectedPartnerId];
    const lastMsg = thread[thread.length - 1];

    await sendMessage({
      recipient_id: selectedPartnerId.startsWith('role_') ? undefined : selectedPartnerId,
      subject: lastMsg.subject?.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject || "Message"}`,
      content: replyContent
    });
    setReplyContent("");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const activeThread = selectedPartnerId ? threads[selectedPartnerId] : null;

  return (
    <div className="flex bg-white h-[calc(100vh-180px)] min-h-[650px] overflow-hidden rounded-[3rem] border border-slate-100 shadow-[0_32px_128px_-16px_rgba(30,41,59,0.1)] font-sans">
      <div className={cn(
        "w-full lg:w-[420px] flex flex-col border-r border-slate-50 bg-slate-50/30 backdrop-blur-3xl shrink-0 transition-all z-20",
        selectedPartnerId && "hidden lg:flex"
      )}>
        <div className="p-10 pb-6 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                 <Sparkles className="h-8 w-8 text-indigo-600" />
                 Threads
              </h2>
              <Button size="icon" className="h-14 w-14 rounded-[1.5rem] bg-indigo-600 shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all" onClick={() => setIsComposeOpen(true)}>
                 <Plus className="h-7 w-7 text-white" />
              </Button>
           </div>
           
           <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-14 h-14 bg-white border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus-visible:ring-indigo-600 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <ScrollArea className="flex-1 px-4">
           <div className="space-y-1 pb-10">
              {inboxItems.length === 0 ? (
                <div className="text-center py-24 opacity-40">
                   <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-slate-400" />
                   </div>
                   <p className="font-black uppercase tracking-widest text-[10px]">Empty Environment</p>
                </div>
              ) : (
                inboxItems.map(item => (
                  <button
                    key={item.partnerId}
                    onClick={() => {
                        setSelectedPartnerId(item.partnerId);
                        if (item.unreadCount > 0) markAsRead(item.latest);
                    }}
                    className={cn(
                      "w-full flex items-center gap-5 p-6 rounded-[2rem] transition-all border group relative",
                      selectedPartnerId === item.partnerId 
                        ? 'bg-white border-white shadow-xl shadow-slate-200/50 scale-[1.02] z-10' 
                        : 'bg-transparent border-transparent hover:bg-white/60 hover:border-white'
                    )}
                  >
                    <div className="relative shrink-0">
                       <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                          <AvatarFallback className={cn(
                             "font-black text-xs",
                             item.partnerRole === 'admin' ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                          )}>
                             {item.partnerId.startsWith('role_') ? <Users /> : getInitials(item.partnerName)}
                          </AvatarFallback>
                       </Avatar>
                       {item.unreadCount > 0 && (
                         <span className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white ring-4 ring-rose-100 animate-bounce">
                           {item.unreadCount}
                         </span>
                       )}
                    </div>

                    <div className="flex-1 min-w-0 text-left space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-900 truncate pr-2 tracking-tight flex items-center gap-2">
                           {item.partnerName}
                           {item.partnerRole && <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 border-slate-100">{item.partnerRole}</Badge>}
                        </h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                           {format(new Date(item.latest.created_at), "h:mm a")}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate font-medium",
                        item.unreadCount > 0 ? "text-slate-900 font-black" : "text-slate-500"
                      )}>
                        {item.latest.content}
                      </p>
                    </div>

                    {selectedPartnerId === item.partnerId && (
                      <motion.div layoutId="active-nav" className="absolute left-2 w-1.5 h-10 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
                    )}
                  </button>
                ))
              )}
           </div>
        </ScrollArea>
      </div>

      <div className={cn(
        "flex-1 flex flex-col bg-white overflow-hidden relative",
        !selectedPartnerId && "hidden lg:flex"
      )}>
        <AnimatePresence mode="wait">
          {activeThread ? (
            <motion.div 
               key="chat"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex-1 flex flex-col h-full bg-[#f8fafc]/20"
            >
               <div className="p-8 border-b border-slate-50 bg-white/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
                  <div className="flex items-center gap-5">
                    <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl -ml-4" onClick={() => setSelectedPartnerId(null)}>
                       <ChevronLeft className="h-7 w-7" />
                    </Button>
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-inner">
                         <AvatarFallback className="font-black bg-indigo-50 text-indigo-600 text-xl">
                            {selectedPartnerId?.startsWith('role_') ? <Users className="h-8 w-8" /> : getInitials(
                               inboxItems.find(i => i.partnerId === selectedPartnerId)?.partnerName || "? ?"
                            )}
                         </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-4 border-white rounded-full" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                          {inboxItems.find(i => i.partnerId === selectedPartnerId)?.partnerName}
                       </h3>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Environment Active</span>
                          <span className="h-1 w-1 bg-slate-300 rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Thread Secured</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                     </Button>
                  </div>
               </div>

               <ScrollArea className="flex-1 px-10 py-12">
                  <div className="space-y-16 max-w-5xl mx-auto">
                     {activeThread.map((msg, idx) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={cn(
                            "flex flex-col gap-3 group translate-y-0",
                            isMine ? "items-end" : "items-start"
                          )}>
                             <div className={cn(
                                "flex flex-col gap-2 relative max-w-[85%] lg:max-w-[70%]",
                                isMine ? "items-end" : "items-start"
                             )}>
                               {!isMine && (
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5 opacity-60">
                                    {msg.sender?.first_name} {msg.sender?.last_name?.[0]}.
                                 </span>
                               )}
                               <div className={cn(
                                  "relative transition-all duration-300",
                                  isMine ? "flex flex-row-reverse" : "flex flex-row"
                               )}>
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className={cn(
                                       "px-8 py-5 rounded-[2.5rem] text-[15px] font-semibold leading-relaxed shadow-lg backdrop-blur-sm",
                                       isMine 
                                          ? "bg-slate-900 text-white rounded-tr-none shadow-slate-200" 
                                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-50"
                                    )}
                                  >
                                     <p className="whitespace-pre-wrap">{msg.content}</p>
                                  </motion.div>
                                  <div className={cn(
                                     "flex items-end px-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                                     isMine ? "mr-2" : "ml-2"
                                  )}>
                                     <span className="text-[10px] font-black text-slate-400">
                                        {format(new Date(msg.created_at), "h:mm p")}
                                     </span>
                                  </div>
                               </div>
                               {idx === activeThread.length - 1 && (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-2">
                                     <Check className="h-3 w-3 text-indigo-500" />
                                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                        Received at {format(new Date(msg.created_at), "h:mm")}
                                     </span>
                                  </motion.div>
                               )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </ScrollArea>

               <div className="p-10 bg-white border-t border-slate-50 relative z-30">
                  <div className="max-w-5xl mx-auto flex items-end gap-5">
                     <div className="flex-1 relative group">
                        <Textarea 
                           placeholder="Enter response details..."
                           className="min-h-[72px] max-h-48 rounded-[2rem] bg-slate-50 border-transparent py-5 px-8 font-semibold text-slate-800 focus-visible:ring-indigo-600 transition-all resize-none shadow-inner text-base"
                           value={replyContent}
                           onChange={(e) => setReplyContent(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                             }
                           }}
                        />
                        <Button variant="ghost" size="icon" className="absolute right-4 bottom-3 rounded-2xl h-10 w-10 text-slate-400 hover:text-indigo-600 bg-white shadow-sm border border-slate-100">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                     </div>
                     <Button 
                        className="h-20 w-20 rounded-full bg-slate-900 group hover:bg-black transition-all active:scale-90 shadow-2xl shadow-indigo-100"
                        disabled={isSending || !replyContent.trim()}
                        onClick={handleSendReply}
                     >
                        <Send className={cn("h-8 w-8 text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1", isSending && "animate-pulse")} />
                     </Button>
                  </div>
               </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-slate-50/20">
                <div className="relative mb-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -inset-10 bg-indigo-500/5 rounded-full blur-3xl" />
                  <div className="relative bg-white p-14 rounded-[3.5rem] shadow-2xl shadow-indigo-100/20 border border-slate-50">
                    <MessageSquare className="h-20 w-20 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-6 max-w-md">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Enterprise <span className="text-indigo-600">Messages</span></h3>
                    <p className="text-slate-500 font-bold leading-[1.8] text-lg">
                       Initialize a conversation with staff, teachers or parents using our unified communication protocol.
                    </p>
                    <div className="pt-8">
                       <Button className="h-16 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-50 group hover:bg-black transition-all" onClick={() => setIsComposeOpen(true)}>
                          <Sparkles className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                          New Broadcast
                       </Button>
                    </div>
                </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-[0_64px_128px_-16px_rgba(0,0,0,0.3)] rounded-[3rem]">
          <div className="bg-slate-900 p-10 flex items-center gap-6">
              <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10">
                  <Plus className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                  <DialogTitle className="text-3xl font-black tracking-tighter">Initialize Component</DialogTitle>
                  <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Inter-organizational Communication Protocol</p>
              </div>
          </div>
          <div className="p-10 space-y-10 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Recipient</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-14 w-full rounded-2xl border-slate-100 bg-slate-50/50 flex items-center justify-between font-bold text-slate-700 px-6">
                        {newMessage.recipientId ? users.find(u => u.id === newMessage.recipientId)?.first_name + ' ' + (users.find(u => u.id === newMessage.recipientId)?.last_name || '') : "Query personnel..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 rounded-2xl border-slate-100 shadow-2xl overflow-hidden" align="start">
                      <Command className="bg-white">
                        <CommandInput placeholder="Enter name or role..." className="h-12 border-none ring-0 font-bold" />
                        <CommandList>
                           <CommandEmpty className="py-6 text-sm font-bold text-slate-400 text-center italic">User collision: Not Found</CommandEmpty>
                           <CommandGroup>
                              {users.map(u => (
                                <CommandItem key={u.id} onSelect={() => { setNewMessage({...newMessage, recipientId: u.id}); setOpenCombobox(false); }} className="p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <Check className={cn("h-4 w-4 text-indigo-600", newMessage.recipientId === u.id ? "opacity-100" : "opacity-0")} />
                                      <span className="font-bold text-slate-700">{u.first_name} {u.last_name}</span>
                                   </div>
                                   <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-indigo-50/50 border-indigo-100 text-indigo-600">{u.role}</Badge>
                                </CommandItem>
                              ))}
                           </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
              <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Header</Label>
                  <Input placeholder="Subject definition" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus-visible:ring-indigo-600 px-6" value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Content Payload</Label>
              <Textarea placeholder="Initialize payload details..." className="min-h-[200px] rounded-[1.5rem] border-slate-100 bg-slate-50/50 p-6 font-medium text-slate-800 resize-none focus-visible:ring-indigo-600 shadow-inner" value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} />
            </div>
            <div className="flex flex-col sm:flex-row gap-8 p-6 bg-[#f8fafc]/50 border border-slate-50 rounded-[1.5rem]">
               <div className="flex items-center gap-4">
                  <Switch checked={newMessage.sendViaSms} onCheckedChange={(c) => setNewMessage({...newMessage, sendViaSms: c})} />
                  <div className="flex items-center gap-2">
                     <Smartphone className="h-4 w-4 text-indigo-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enable SMS Hook</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <Switch checked={newMessage.sendViaEmail} onCheckedChange={(c) => setNewMessage({...newMessage, sendViaEmail: c})} />
                  <div className="flex items-center gap-2">
                     <Mail className="h-4 w-4 text-emerald-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email SMTP Integration</span>
                  </div>
               </div>
            </div>
            <div className="flex justify-end gap-5 pt-4">
              <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold text-slate-400" onClick={() => setIsComposeOpen(false)}>Terminate</Button>
              <Button 
                className="h-14 px-12 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 disabled:opacity-30"
                onClick={() => {
                  sendMessage({ subject: newMessage.subject, content: newMessage.content, recipient_id: newMessage.recipientId, sent_via_sms: newMessage.sendViaSms, sent_via_email: newMessage.sendViaEmail });
                  setIsComposeOpen(false);
                  setNewMessage({ subject: "", content: "", recipientId: "", sendViaSms: false, sendViaEmail: false });
                }}
                disabled={isSending || !newMessage.recipientId || !newMessage.subject || !newMessage.content}
              >
                {isSending ? "Processing..." : "Execute Send"} 
                <Send className="ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageSystem;
