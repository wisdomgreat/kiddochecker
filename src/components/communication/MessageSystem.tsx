import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMessages, type Message } from "@/hooks/useMessages";
import {
  MessageSquare, Send, Mail, Plus, Search, Clock, Check, 
  ChevronsUpDown, Smartphone, MoreVertical, Paperclip, ChevronLeft, Users, Loader2
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
          partnerName = partnerId === 'role_all' ? 'Everyone' : `Team: ${partnerId.replace('role_', '')}`;
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
    <div className="flex bg-card h-[calc(100vh-140px)] overflow-hidden rounded-lg border shadow-sm">
      {/* Sidebar */}
      <div className={cn(
        "w-full lg:w-[350px] flex flex-col border-r bg-muted/10 shrink-0",
        selectedPartnerId && "hidden lg:flex"
      )}>
        <div className="p-6 space-y-4 border-b">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Messages</h2>
              <Button size="sm" variant="outline" className="h-9 w-9 px-0" onClick={() => setIsComposeOpen(true)}>
                 <Plus className="h-4 w-4" />
              </Button>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter messages..." 
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <ScrollArea className="flex-1">
           <div className="divide-y">
              {inboxItems.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                   <p className="text-xs font-bold uppercase tracking-widest">No messages found</p>
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
                      "w-full flex items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50",
                      selectedPartnerId === item.partnerId ? 'bg-muted' : ''
                    )}
                  >
                    <div className="relative shrink-0 mt-1">
                       <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="font-bold text-[10px] bg-slate-100 uppercase">
                             {item.partnerId.startsWith('role_') ? <Users className="h-4 w-4" /> : getInitials(item.partnerName)}
                          </AvatarFallback>
                       </Avatar>
                       {item.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-slate-950 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
                            {item.unreadCount}
                          </span>
                       )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-bold text-sm truncate mr-2 tracking-tight">{item.partnerName}</p>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                           {format(new Date(item.latest.created_at), "HH:mm")}
                        </span>
                      </div>
                      <p className={cn(
                        "text-[11px] truncate",
                        item.unreadCount > 0 ? "text-slate-950 font-bold" : "text-muted-foreground"
                      )}>
                        {item.latest.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
           </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col bg-card overflow-hidden",
        !selectedPartnerId && "hidden lg:flex"
      )}>
          {activeThread ? (
            <>
               <div className="p-4 border-b flex items-center justify-between bg-muted/5">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedPartnerId(null)}>
                       <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="font-bold text-[10px] bg-slate-100">
                             {selectedPartnerId?.startsWith('role_') ? <Users className="h-4 w-4" /> : getInitials(
                                inboxItems.find(i => i.partnerId === selectedPartnerId)?.partnerName || "?"
                             )}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                       <p className="font-bold text-sm leading-none">{inboxItems.find(i => i.partnerId === selectedPartnerId)?.partnerName}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Verified Channel</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4 opacity-40" />
                  </Button>
               </div>

               <ScrollArea className="flex-1 p-6">
                  <div className="space-y-12 max-w-4xl mx-auto">
                     {activeThread.map((msg, idx) => {
                        const isMine = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={cn(
                            "flex flex-col gap-1.5",
                            isMine ? "items-end" : "items-start"
                          )}>
                             <div className={cn(
                                "max-w-[85%] lg:max-w-[70%] flex flex-col gap-1",
                                isMine ? "items-end" : "items-start"
                             )}>
                               {!isMine && <p className="text-[9px] font-bold uppercase text-muted-foreground px-2">{msg.sender?.first_name} {msg.sender?.last_name}</p>}
                               <div className={cn(
                                   "px-4 py-3 rounded-lg text-sm transition-shadow",
                                   isMine 
                                      ? "bg-slate-900 text-white rounded-tr-none shadow-sm" 
                                      : "bg-muted text-foreground rounded-tl-none border"
                               )}>
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                               </div>
                               <p className="text-[9px] text-muted-foreground font-bold uppercase py-0.5 px-2">
                                  {format(new Date(msg.created_at), "HH:mm")}
                                  {isMine && idx === activeThread.length - 1 && " • Delivered"}
                               </p>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </ScrollArea>

               <div className="p-6 border-t bg-muted/5">
                  <div className="max-w-4xl mx-auto flex items-end gap-3">
                     <div className="flex-1 relative">
                        <Textarea 
                           placeholder="Type your response..."
                           className="min-h-[60px] max-h-40 rounded-lg p-4 text-sm resize-none"
                           value={replyContent}
                           onChange={(e) => setReplyContent(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                             }
                           }}
                        />
                        <Button variant="ghost" size="icon" className="absolute right-2 bottom-2 h-8 w-8 text-muted-foreground">
                            <Paperclip className="h-4 w-4" />
                        </Button>
                     </div>
                     <Button 
                        className="h-[60px] w-[60px] rounded-lg bg-slate-900 hover:bg-black"
                        disabled={isSending || !replyContent.trim()}
                        onClick={handleSendReply}
                     >
                        {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                     </Button>
                  </div>
               </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-muted/5">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold tracking-tight">Select a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">Select a message from the list to view the full discussion thread.</p>
                <Button className="mt-8 font-bold uppercase text-[10px] tracking-widest px-8" onClick={() => setIsComposeOpen(true)}>
                   Start New Thread
                </Button>
            </div>
          )}
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/50 border-b">
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>Initialize a secure communication channel.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Recipient</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-12 w-full justify-between font-bold text-sm px-4">
                        {newMessage.recipientId ? users.find(u => u.id === newMessage.recipientId)?.first_name + ' ' + (users.find(u => u.id === newMessage.recipientId)?.last_name || '') : "Select user..."}
                        <ChevronsUpDown className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 shadow-lg border rounded-lg overflow-hidden" align="start">
                      <Command>
                        <CommandInput placeholder="Search people..." />
                        <CommandList>
                           <CommandEmpty className="p-4 text-xs font-bold uppercase text-muted-foreground text-center">Not found</CommandEmpty>
                           <CommandGroup>
                              {users.map(u => (
                                <CommandItem key={u.id} onSelect={() => { setNewMessage({...newMessage, recipientId: u.id}); setOpenCombobox(false); }} className="p-3 cursor-pointer">
                                   <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                         <Check className={cn("h-4 w-4 text-primary", newMessage.recipientId === u.id ? "opacity-100" : "opacity-0")} />
                                         <span className="font-bold">{u.first_name} {u.last_name}</span>
                                      </div>
                                      <Badge variant="outline" className="text-[9px] font-bold uppercase bg-slate-50">{u.role}</Badge>
                                   </div>
                                </CommandItem>
                              ))}
                           </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>
              <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Subject</Label>
                  <Input placeholder="Theme..." className="h-12 font-bold px-4" value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Content</Label>
              <Textarea placeholder="Details..." className="min-h-[150px] p-4 text-sm resize-none" value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} />
            </div>
            <div className="flex items-center gap-6 p-4 bg-muted/20 border rounded-lg">
               <div className="flex items-center gap-3">
                  <Switch checked={newMessage.sendViaSms} onCheckedChange={(c) => setNewMessage({...newMessage, sendViaSms: c})} />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">SMS Alert</span>
               </div>
               <div className="flex items-center gap-3">
                  <Switch checked={newMessage.sendViaEmail} onCheckedChange={(c) => setNewMessage({...newMessage, sendViaEmail: c})} />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Email Delivery</span>
               </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t">
            <Button variant="ghost" onClick={() => setIsComposeOpen(false)} className="font-bold uppercase text-xs">Cancel</Button>
            <Button 
                className="font-bold uppercase text-xs h-11 px-8"
                onClick={() => {
                  sendMessage({ subject: newMessage.subject, content: newMessage.content, recipient_id: newMessage.recipientId, sent_via_sms: newMessage.sendViaSms, sent_via_email: newMessage.sendViaEmail });
                  setIsComposeOpen(false);
                  setNewMessage({ subject: "", content: "", recipientId: "", sendViaSms: false, sendViaEmail: false });
                }}
                disabled={isSending || !newMessage.recipientId || !newMessage.subject || !newMessage.content}
              >
                Send Message
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageSystem;


