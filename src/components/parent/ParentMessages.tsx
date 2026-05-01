import React, { useState, useEffect, useMemo } from "react";
import { useMessages, type Message } from "@/hooks/useMessages";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Mail, Search, Reply, Plus, MoreVertical, Paperclip, ChevronLeft, Inbox, Megaphone } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaffRecipient {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ParentMessages = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = useMessages();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recipients, setRecipients] = useState<StaffRecipient[]>([]);
  const [newMsg, setNewMsg] = useState({
    recipientId: "",
    subject: "",
    content: ""
  });

  // Group messages into conversations (threads)
  const threads = useMemo(() => {
    const parentMessages = messages.filter(m => 
      m.sender_id === user?.id || 
      m.recipient_id === user?.id || 
      m.recipient_role === 'parents' || 
      m.recipient_role === 'all'
    );

    const groups: Record<string, Message[]> = {};
    
    parentMessages.forEach(msg => {
      // Determine the 'conversation partner' id
      // For broadcasts, we use the role as the 'partner' id key
      let partnerId = "";
      if (msg.is_broadcast || msg.recipient_role) {
         partnerId = `role_${msg.recipient_role}`;
      } else {
         partnerId = msg.sender_id === user?.id ? (msg.recipient_id || "unknown") : msg.sender_id;
      }

      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });

    // Sort messages in each group by date ASC for the stream
    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return groups;
  }, [messages, user?.id]);

  // Derived list of latest message per thread for the inbox
  const inboxItems = useMemo(() => {
    return Object.entries(threads)
      .map(([partnerId, msgList]) => {
        const latest = msgList[msgList.length - 1];
        const unreadCount = msgList.filter(m => !m.is_read && m.recipient_id === user?.id).length;
        return { partnerId, latest, unreadCount, allMessages: msgList };
      })
      .sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
      .filter(item => {
        const name = item.partnerId.startsWith('role_') ? 'Broadcast' : 
          item.latest.sender_id === user?.id 
            ? `${item.latest.recipient?.first_name || ''} ${item.latest.recipient?.last_name || ''}`
            : `${item.latest.sender?.first_name || ''} ${item.latest.sender?.last_name || ''}`;
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               item.latest.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [threads, searchTerm, user?.id]);

  useEffect(() => {
    const fetchRecipients = async () => {
      const { data, error } = await supabase.rpc('get_available_recipients');
      if (!error && data) {
         const staff = data.filter((r: any) => ['admin', 'staff', 'teacher', 'teacher_assistant'].includes(r.role));
         setRecipients(staff);
      }
    };
    fetchRecipients();
  }, []);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedPartnerId) return;
    
    const partnerThread = threads[selectedPartnerId];
    if (!partnerThread || partnerThread.length === 0) return;
    const lastMsg = partnerThread[partnerThread.length - 1];

    await sendMessage({
      recipient_id: selectedPartnerId.startsWith('role_') ? undefined : selectedPartnerId,
      subject: lastMsg.subject?.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject || "Message"}`,
      content: replyContent
    });

    setReplyContent("");
  };

  const getInitials = (first?: string, last?: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "??";
  };

  const activeThread = selectedPartnerId ? threads[selectedPartnerId] : null;

  return (
    <div className="flex bg-[#f8fafc] dark:bg-slate-950 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl dark:shadow-black/60">
      {/* Sidebar - Inbox */}
      <div className={cn(
        "w-full lg:w-[400px] flex flex-col border-r border-slate-100 dark:border-white/5 bg-card/70 dark:bg-slate-900/70 backdrop-blur-xl shrink-0 transition-all",
        selectedPartnerId && "hidden lg:flex"
      )}>
        <div className="p-8 border-b border-slate-50 dark:border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground dark:text-slate-100 tracking-tight flex items-center gap-3">
               <Mail className="h-8 w-8 text-indigo-600" />
               Inbox
            </h1>
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-slate-900 dark:bg-indigo-600 shadow-xl shadow-slate-200 dark:shadow-indigo-500/20" onClick={() => { setIsComposing(true); setSelectedPartnerId(null); }}>
              <Plus className="h-6 w-6 text-white" />
            </Button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-11 h-12 bg-slate-50/50 dark:bg-card/5 border-slate-100 dark:border-white/10 rounded-2xl text-xs font-bold focus-visible:ring-indigo-600 transition-all text-foreground dark:text-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {isLoading ? (
               Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-2 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : inboxItems.length === 0 ? (
              <div className="text-center py-20 px-8">
                <div className="p-4 bg-slate-50 rounded-full inline-block mb-4">
                  <Inbox className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">No Messages Found</p>
              </div>
            ) : (
              inboxItems.map(({ partnerId, latest, unreadCount }) => {
                const isRole = partnerId.startsWith('role_');
                const partnerName = isRole ? (partnerId === 'role_all' ? 'Announcement' : 'Church Admins') : 
                  latest.sender_id === user?.id 
                    ? `${latest.recipient?.first_name || ''} ${latest.recipient?.last_name || ''}`
                    : `${latest.sender?.first_name || ''} ${latest.sender?.last_name || ''}`;
                
                const role = isRole ? null : (latest.sender_id === user?.id ? latest.recipient?.role : latest.sender?.role);

                return (
                  <button
                    key={partnerId}
                    onClick={() => {
                      setSelectedPartnerId(partnerId);
                      setIsComposing(false);
                      // Mark all unread in this thread as read
                      // Normally this would be a bulk update, for now we just mark the last one
                      if (unreadCount > 0) markAsRead(latest);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-3xl transition-all border group relative",
                      selectedPartnerId === partnerId 
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/20 shadow-sm shadow-indigo-100/50 dark:shadow-black/20' 
                      : 'bg-transparent border-transparent hover:bg-slate-50/80 dark:hover:bg-card/5 hover:border-slate-100 dark:hover:border-white/5'
                    )}
                  >
                    <div className="relative">
                      <Avatar className={cn(
                        "h-12 w-12 border-2",
                        selectedPartnerId === partnerId ? "border-indigo-200" : "border-white"
                      )}>
                        <AvatarFallback className={cn(
                          "font-bold text-xs",
                          role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                        )}>
                          {isRole ? <Megaphone className="h-5 w-5" /> : getInitials(partnerName.split(' ')[0], partnerName.split(' ')[1])}
                        </AvatarFallback>
                      </Avatar>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-foreground dark:text-slate-100 truncate pr-2 tracking-tight">
                          {partnerName}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                          {format(new Date(latest.created_at), "MMM d")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                          "text-xs truncate flex-1",
                          unreadCount > 0 ? "font-bold text-foreground dark:text-slate-100" : "text-slate-500 dark:text-slate-400 font-medium"
                        )}>
                          {latest.subject}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                         {latest.content}
                      </p>
                    </div>
                    
                    {selectedPartnerId === partnerId && (
                      <motion.div layoutId="active-indicator" className="absolute left-1 w-1 h-8 bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Stream */}
      <div className={cn(
        "flex-1 flex flex-col bg-card dark:bg-slate-900 overflow-hidden relative",
        !selectedPartnerId && !isComposing && "hidden lg:flex"
      )}>
        <AnimatePresence mode="wait">
          {isComposing ? (
            <motion.div 
              key="compose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col h-full bg-slate-50/30"
            >
              <div className="p-8 border-b border-slate-100 bg-card/50 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-foreground tracking-tight">New Conversation</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Start a private thread with staff</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setIsComposing(false)}>
                   <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="grid gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Recipient</Label>
                      <Select onValueChange={(v) => setNewMsg({...newMsg, recipientId: v})}>
                        <SelectTrigger className="h-14 rounded-[1.25rem] border-slate-200 bg-card shadow-sm font-bold">
                          <SelectValue placeholder="Select a staff member" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          {recipients.map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6 border">
                                  <AvatarFallback className="text-[8px] font-bold">{getInitials(r.first_name, r.last_name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold">{r.first_name} {r.last_name}</span>
                                <Badge variant="outline" className="text-[8px] font-bold uppercase text-indigo-600 bg-indigo-50 border-indigo-100">{r.role}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Subject Matter</Label>
                      <Input 
                        placeholder="What is this regarding?" 
                        className="h-14 rounded-[1.25rem] border-slate-200 shadow-sm font-bold focus-visible:ring-indigo-600"
                        value={newMsg.subject} 
                        onChange={e => setNewMsg({...newMsg, subject: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Message Content</Label>
                      <Textarea 
                        placeholder="Type your message details here..." 
                        className="min-h-[280px] rounded-[2rem] border-slate-200 bg-card shadow-sm font-medium p-6 focus-visible:ring-indigo-600 leading-relaxed" 
                        value={newMsg.content}
                        onChange={e => setNewMsg({...newMsg, content: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t border-slate-100 bg-card flex justify-end gap-3">
                <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold px-6" onClick={() => setIsComposing(false)}>Discard</Button>
                <Button 
                  className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-xl shadow-indigo-100 dark:shadow-indigo-500/20 disabled:opacity-50"
                  onClick={async () => {
                     if (!newMsg.recipientId || !newMsg.content.trim()) return;
                     await sendMessage({
                       recipient_id: newMsg.recipientId,
                       subject: newMsg.subject || `Inquiry from ${user?.email}`,
                       content: newMsg.content
                     });
                     setNewMsg({ recipientId: "", subject: "", content: "" });
                     setIsComposing(false);
                  }} 
                  disabled={isSending || !newMsg.recipientId || !newMsg.content}
                >
                  {isSending ? "Syncing..." : "Send Message"} <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : activeThread ? (
            <motion.div 
               key="active-chat"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex-1 flex flex-col h-full bg-[#f8fafc]/30"
            >
               {/* Chat Header */}
               <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-white/5 bg-card/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="lg:hidden rounded-2xl -ml-2" onClick={() => setSelectedPartnerId(null)}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Avatar className="h-12 w-12 border shadow-sm">
                       <AvatarFallback className="font-bold text-indigo-600 bg-indigo-50">
                          {selectedPartnerId?.startsWith('role_') ? <Megaphone /> : getInitials(
                            activeThread[0].sender_id === user?.id ? activeThread[0].recipient?.first_name : activeThread[0].sender?.first_name,
                            activeThread[0].sender_id === user?.id ? activeThread[0].recipient?.last_name : activeThread[0].sender?.last_name
                          )}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                       <h3 className="font-bold text-foreground leading-none">
                         {selectedPartnerId?.startsWith('role_') ? (selectedPartnerId === 'role_all' ? 'Announcement' : 'Church Admins') : (
                           activeThread[0].sender_id === user?.id 
                           ? `${activeThread[0].recipient?.first_name || ''} ${activeThread[0].recipient?.last_name || ''}`
                           : `${activeThread[0].sender?.first_name || ''} ${activeThread[0].sender?.last_name || ''}`
                         )}
                       </h3>
                       <div className="flex items-center gap-2 mt-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Thread</span>
                       </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-2xl text-slate-400">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
               </div>

               {/* Stream */}
               <ScrollArea className="flex-1 px-8 py-10">
                  <div className="space-y-12 max-w-4xl mx-auto">
                    {/* Date Separator example */}
                    <div className="flex items-center gap-4 opacity-30">
                       <div className="flex-1 h-px bg-slate-400" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Message History</span>
                       <div className="flex-1 h-px bg-slate-400" />
                    </div>

                    {activeThread.map((msg, idx) => {
                       const isMine = msg.sender_id === user?.id;
                       const prevMsg = idx > 0 ? activeThread[idx - 1] : null;
                       const showSender = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

                       return (
                         <div key={msg.id} className={cn(
                           "flex flex-col gap-2",
                           isMine ? "items-end" : "items-start"
                         )}>
                           {showSender && !selectedPartnerId?.startsWith('role_') && (
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-3 mb-1">
                                {msg.sender?.first_name} {msg.sender?.last_name}
                             </span>
                           )}
                           
                           <div className={cn(
                              "relative group max-w-[85%] lg:max-w-[70%]",
                              isMine ? "flex flex-row-reverse" : "flex flex-row"
                           )}>
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={cn(
                                "px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm",
                                isMine 
                                  ? "bg-slate-900 text-white rounded-tr-none" 
                                  : "bg-card text-foreground rounded-tl-none border border-slate-100"
                              )}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </motion.div>
                              
                              <div className={cn(
                                "flex items-end px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                                isMine ? "mr-1" : "ml-1"
                              )}>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                   {format(new Date(msg.created_at), "h:mm a")}
                                </span>
                              </div>
                           </div>
                           
                           {/* Show timestamp if significant gap or last message */}
                           {(idx === activeThread.length - 1) && (
                              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1 mx-2">
                                Delivered • {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </span>
                           )}
                         </div>
                       );
                    })}
                  </div>
               </ScrollArea>

               {/* Reply Bar */}
               {!selectedPartnerId?.startsWith('role_') && (
                 <div className="p-8 bg-card border-t border-slate-100">
                    <div className="max-w-4xl mx-auto flex items-end gap-4 relative">
                       <div className="flex-1 relative group">
                          <Textarea 
                            placeholder="Type your message..."
                            className="min-h-[64px] max-h-40 rounded-[1.75rem] bg-slate-50/50 border-slate-200 py-4 px-6 font-medium focus-visible:ring-indigo-600 transition-all resize-none shadow-inner"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />
                          <Button variant="ghost" size="icon" className="absolute left-2 bottom-2 rounded-xl text-slate-400">
                            <Paperclip className="h-5 w-5" />
                          </Button>
                       </div>
                       <Button 
                          className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 group transition-all active:scale-90"
                          disabled={isSending || !replyContent.trim()}
                          onClick={handleSendReply}
                       >
                          <Send className={cn("h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1", isSending && "animate-pulse")} />
                       </Button>
                    </div>
                 </div>
               )}
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl" 
                  />
                  <div className="relative bg-card dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/30 dark:shadow-black/60">
                    <MessageSquare className="h-16 w-16 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-4 max-w-sm">
                    <h3 className="text-3xl font-bold text-foreground tracking-tight">Select <span className="text-indigo-600">Conversation</span></h3>
                    <p className="text-slate-500 font-bold leading-relaxed px-4 italic">
                        Start a dialogue with our specialized staff or browse your previous organizational updates.
                    </p>
                    <div className="pt-4">
                      <Button className="rounded-[1.5rem] h-14 px-8 bg-slate-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-black shadow-xl shadow-slate-200" onClick={() => setIsComposing(true)}>
                         <Plus className="h-5 w-5 mr-3" /> New Thread
                      </Button>
                    </div>
                </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentMessages;


