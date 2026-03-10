import React, { useState, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Send, Mail, Clock, Search, Reply, Plus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface StaffRecipient {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ParentMessages = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = useMessages();
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [recipients, setRecipients] = useState<StaffRecipient[]>([]);
  const [newMsg, setNewMsg] = useState({
    recipientId: "",
    subject: "",
    content: ""
  });

  // Fetch only staff for parents to message
  useEffect(() => {
    const fetchRecipients = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles:user_id (id, first_name, last_name)
        `)
        .in('role', ['admin', 'staff', 'teacher', 'teacher_assistant'])
        .limit(100);

      if (data && !error) {
        const staff = data
          .filter(item => item.profiles)
          .map(item => ({
            id: item.user_id,
            first_name: (item.profiles as any).first_name,
            last_name: (item.profiles as any).last_name,
            role: item.role
          }));
        setRecipients(staff);
      }
    };
    fetchRecipients();
  }, []);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !activeMessageId) return;
    
    const originalMsg = messages.find(m => m.id === activeMessageId);
    if (!originalMsg) return;

    await sendMessage({
      recipient_id: originalMsg.sender_id,
      subject: originalMsg.subject?.startsWith("Re:") ? originalMsg.subject : `Re: ${originalMsg.subject || "Message"}`,
      content: replyContent
    });

    setReplyContent("");
    setActiveMessageId(null);
  };

  const handleComposeNew = async () => {
    if (!newMsg.recipientId || !newMsg.content.trim()) return;

    await sendMessage({
      recipient_id: newMsg.recipientId,
      subject: newMsg.subject || `Message from Parent`,
      content: newMsg.content
    });

    setNewMsg({ recipientId: "", subject: "", content: "" });
    setIsComposing(false);
  };

  const parentMessages = messages.filter(m => 
    m.sender_id === user?.id || 
    m.recipient_id === user?.id || 
    m.recipient_role === 'parents' || 
    m.recipient_role === 'all'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* Sidebar: Message List */}
      <Card className="lg:col-span-4 overflow-hidden flex flex-col border-primary/10 shadow-lg">
        <CardHeader className="bg-muted/30 border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Inbox
            </CardTitle>
            <Button size="sm" variant="default" onClick={() => setIsComposing(true)} className="h-8 rounded-full px-3">
              <Plus className="h-4 w-4 mr-1" /> Compose
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9 bg-background/50 h-9" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading ? (
               Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))
            ) : parentMessages.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-muted-foreground text-sm italic">No messages found</p>
              </div>
            ) : (
              parentMessages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => {
                    setActiveMessageId(msg.id);
                    setIsComposing(false);
                    if (!msg.is_read && msg.recipient_id === user?.id) markAsRead(msg);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    activeMessageId === msg.id 
                    ? 'bg-primary/10 border-primary/20 shadow-sm' 
                    : 'bg-card border-transparent hover:bg-muted/50'
                  } ${!msg.is_read && msg.recipient_id === user?.id ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm truncate max-w-[150px]">
                      {msg.sender_id === user?.id ? `To: ${msg.recipient?.first_name || 'Staff'}` : `${msg.sender?.first_name} ${msg.sender?.last_name}`}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(msg.created_at), "MMM d")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-xs truncate ${!msg.is_read && msg.recipient_id === user?.id ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {msg.subject || "(No Subject)"}
                    </h4>
                    {!msg.is_read && msg.recipient_id === user?.id && (
                        <Badge className="h-2 w-2 rounded-full p-0 bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    {msg.content}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Content: Message View / Compose */}
      <Card className="lg:col-span-8 overflow-hidden flex flex-col border-primary/10 shadow-lg relative">
        <AnimatePresence mode="wait">
          {isComposing ? (
            <motion.div 
              key="compose"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full"
            >
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="text-lg">New Message</CardTitle>
                <CardDescription>Compose a message to our staff members</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Select Staff Recipient</Label>
                    <Select onValueChange={(v) => setNewMsg({...newMsg, recipientId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Who would you like to message?" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{r.first_name} {r.last_name}</span>
                              <Badge variant="outline" className="text-[10px] uppercase">{r.role}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input placeholder="What is this about?" value={newMsg.subject} onChange={e => setNewMsg({...newMsg, subject: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Message</Label>
                    <Textarea 
                      placeholder="Type your message here..." 
                      className="min-h-[250px] resize-none" 
                      value={newMsg.content}
                      onChange={e => setNewMsg({...newMsg, content: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-4 bg-muted/30 border-t flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsComposing(false)}>Cancel Document</Button>
                <Button onClick={handleComposeNew} disabled={isSending || !newMsg.recipientId || !newMsg.content}>
                  {isSending ? "Sending..." : "Send Message"} <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ) : activeMessageId ? (
            <motion.div 
                key="view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col h-full"
            >
                {messages.filter(m => m.id === activeMessageId).map(msg => (
                    <React.Fragment key={msg.id}>
                        <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between py-4">
                            <div>
                                <CardTitle className="text-lg mb-1">{msg.subject || "(No Subject)"}</CardTitle>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        {msg.sender_id === user?.id ? "You" : `${msg.sender?.first_name} ${msg.sender?.last_name}`}
                                    </span>
                                    <span>•</span>
                                    <span>{format(new Date(msg.created_at), "PPPP 'at' p")}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-6">
                            <div className="max-w-[90%] mx-auto bg-card border rounded-2xl p-6 shadow-sm">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                            </div>
                            
                            {/* Reply Section */}
                            <div className="mt-8 max-w-[90%] mx-auto space-y-4">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Reply className="h-4 w-4" /> Quick Reply
                                </Label>
                                <div className="relative">
                                    <Textarea 
                                        placeholder={`Reply to ${msg.sender_id === user?.id ? (msg.recipient?.first_name || 'Staff') : (msg.sender?.first_name || 'Staff')}...`}
                                        className="min-h-[120px] rounded-2xl p-4 bg-muted/20 focus-visible:ring-primary border-primary/20"
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                    />
                                    <div className="absolute bottom-3 right-3">
                                        <Button 
                                            size="sm" 
                                            className="rounded-full shadow-lg h-9 w-9 p-0" 
                                            disabled={isSending || !replyContent.trim()}
                                            onClick={handleSendReply}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </React.Fragment>
                ))}
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 bg-muted/5">
                <div className="bg-primary/10 p-6 rounded-full inline-block">
                    <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">Select a message</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        Choose a conversation from the sidebar or start a new message to get in touch with our staff.
                    </p>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => setIsComposing(true)}>
                   <Plus className="h-4 w-4 mr-2" /> Start New Conversation
                </Button>
            </div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default ParentMessages;
