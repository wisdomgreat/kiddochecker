
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import {
  MessageSquare,
  Send,
  Mail,
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  Check,
  ChevronsUpDown
} from "lucide-react";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  recipient_role?: string;
  is_broadcast?: boolean;
  created_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
  };
}

const MessageSystem = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    recipientId: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { messages, isLoading, error, refetch, sendMessage, isSending, markAsRead } = useMessages();

  // Fetch staff and teachers for recipient selection
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            role,
            profiles:user_id (
              id,
              first_name,
              last_name
            )
          `)
          .in('role', ['admin', 'staff', 'teacher', 'teacher_assistant', 'parent'])
          .limit(1000);

        if (staffError) {
          console.error("Error fetching staff:", staffError);
          return;
        }

        const recipientUsers: User[] = (staffData || [])
          .filter(item => item.profiles)
          .map(item => ({
            id: item.user_id,
            first_name: (item.profiles as any)?.first_name || '',
            last_name: (item.profiles as any)?.last_name || '',
            email: '', 
            role: item.role
          }));

        setUsers(recipientUsers);
      } catch (error: any) {
        console.error("Error fetching recipients:", error);
      }
    };

    fetchRecipients();
  }, []);

  // Real-time message subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const filteredMessages = React.useMemo(() => {
    if (!messages) return [];

    let filtered = messages;
    
    if (activeTab === "inbox") {
      filtered = messages.filter(m => m.recipient_id === user?.id || (m.recipient_role && m.sender_id !== user?.id));
    } else {
      filtered = messages.filter(m => m.sender_id === user?.id);
    }

    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.recipient?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.recipient?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [messages, searchQuery, activeTab, user?.id]);

  const unreadCount = React.useMemo(() => {
    return messages?.filter(m => !m.is_read && (m.recipient_id === user?.id || m.recipient_role)).length || 0;
  }, [messages, user?.id]);

  const handleReply = (message: any) => {
    setNewMessage({
      recipientId: message.sender_id,
      subject: message.subject?.startsWith("Re:") ? message.subject : `Re: ${message.subject || "Message"}`,
      content: `\n\n--- Original Message ---\n${message.content}`
    });
    setIsComposeOpen(true);
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
            <MessageSquare className="h-6 w-6" />
            Message Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-2 py-0.5 text-xs animate-pulse">
                {unreadCount} New
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[250px] bg-background"
                />
            </div>
            <Button onClick={() => setIsComposeOpen(true)} className="flex-shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Compose
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="inbox" className="gap-2">
              <Mail className="h-4 w-4" />
              Inbox {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading your messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {activeTab === "inbox" ? <Mail className="h-8 w-8 text-muted-foreground" /> : <Send className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="font-semibold text-xl mb-2">No messages found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {searchQuery ? "Try adjusting your search query." : activeTab === "inbox" ? "Your inbox is empty. When you receive messages, they will appear here." : "You haven't sent any messages yet."}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {filteredMessages.map((message, idx) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Card className={`overflow-hidden transition-all hover:shadow-md ${!message.is_read && activeTab === "inbox" ? 'border-primary/30 bg-primary/5' : 'bg-card border-muted'}`}>
                        <div className="p-5">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center flex-wrap gap-2">
                                {!message.is_read && activeTab === "inbox" && (
                                  <Badge variant="default" className="text-[10px] uppercase font-bold px-1.5 py-0">New</Badge>
                                )}
                                <h3 className="font-bold text-lg leading-tight">
                                  {message.subject || 'No Subject'}
                                </h3>
                                {message.recipient_role && (
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                        Broadcast: {message.recipient_role}
                                    </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {activeTab === "inbox" ? "From:" : "To:"}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {activeTab === "inbox" 
                                    ? `${message.sender?.first_name} ${message.sender?.last_name}`
                                    : message.recipient 
                                        ? `${message.recipient.first_name} ${message.recipient.last_name}`
                                        : message.recipient_role ? `All ${message.recipient_role}` : "Anonymous"}
                                </span>
                                {(activeTab === "inbox" ? message.sender?.role : message.recipient?.role) && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                        {activeTab === "inbox" ? message.sender?.role : message.recipient?.role}
                                    </Badge>
                                )}
                              </div>

                              <div className="relative mt-2 p-3 bg-muted/40 rounded-md">
                                <p className="text-sm whitespace-pre-wrap text-foreground/90 italic">
                                  "{message.content}"
                                </p>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
                                <Clock className="h-3 w-3" />
                                {new Date(message.created_at).toLocaleString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                              </div>
                            </div>
                            
                            <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                                {activeTab === "inbox" && (
                                    <>
                                        {!message.is_read && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => markAsRead(message)}
                                                className="bg-background hover:bg-primary/10 hover:text-primary transition-colors h-8"
                                            >
                                                Mark Read
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleReply(message)}
                                            className="h-8 gap-1"
                                        >
                                            <Send className="h-3.5 w-3.5 rotate-45 mr-1" />
                                            Reply
                                        </Button>
                                    </>
                                )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-primary px-6 py-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="text-white">
                    <DialogTitle className="text-xl font-bold">Compose Message</DialogTitle>
                    <p className="text-primary-foreground/70 text-xs">Send a new message or reply to an existing one</p>
                </div>
            </div>
            
            <div className="p-6 space-y-5 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                    <Label htmlFor="recipient" className="text-sm font-semibold">
                    To <span className="text-destructive">*</span>
                    </Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="justify-between transition-all hover:border-primary/50 w-full font-normal"
                        >
                          {newMessage.recipientId
                            ? (users.find((user) => user.id === newMessage.recipientId)?.first_name + " " + users.find((user) => user.id === newMessage.recipientId)?.last_name) || "Unknown User"
                            : "Select a recipient..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ zIndex: 9999 }}>
                        <Command>
                          <CommandInput placeholder="Search people..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No person found.</CommandEmpty>
                            <CommandGroup>
                              {users.map((recipient) => (
                                <CommandItem
                                  key={recipient.id}
                                  value={`${recipient.first_name} ${recipient.last_name}`}
                                  onSelect={() => {
                                    setNewMessage({ ...newMessage, recipientId: recipient.id });
                                    setOpenCombobox(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          newMessage.recipientId === recipient.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="font-medium">
                                      {recipient.first_name} {recipient.last_name}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold shrink-0">
                                    {recipient.role}
                                    </Badge>
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
                    <Label htmlFor="subject" className="text-sm font-semibold">
                    Subject <span className="text-destructive">*</span>
                    </Label>
                    <Input
                    id="subject"
                    placeholder="Enter message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    className="transition-all hover:border-primary/50"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-semibold">
                  Message Body <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="min-h-[180px] resize-none transition-all hover:border-primary/50 focus-visible:ring-primary"
                />
              </div>

              <div className="flex justify-end items-center gap-3 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsComposeOpen(false);
                    setNewMessage({ subject: "", content: "", recipientId: "" });
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Discard
                </Button>
                  <Button
                    onClick={() => {
                        sendMessage({
                            subject: newMessage.subject,
                            content: newMessage.content,
                            recipient_id: newMessage.recipientId
                        });
                        setIsComposeOpen(false);
                        setNewMessage({ subject: "", content: "", recipientId: "" });
                    }}
                    disabled={
                      isSending ||
                      !newMessage.recipientId ||
                      !newMessage.subject ||
                      !newMessage.content
                    }
                    className="px-8 shadow-md"
                  >
                    {isSending ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                        </>
                    )}
                  </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};


export default MessageSystem;
