
import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/CleanAuthContext";
import { 
  MessageSquare, 
  Send, 
  Mail, 
  Users, 
  Plus,
  Search,
  Filter
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
  const [filterRole, setFilterRole] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    recipientId: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!user?.id) return [];

      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return [];
        }

        if (!messagesData || messagesData.length === 0) {
          return [];
        }

        const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        const messagesWithSenders = messagesData.map(message => ({
          ...message,
          sender: profiles?.find(profile => profile.id === message.sender_id) || undefined
        }));

        return messagesWithSenders;
      } catch (error: any) {
        console.error("Error in useMessages:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

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
          .in('role', ['admin', 'staff', 'teacher', 'teacher_assistant'])
          .limit(100);

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
            email: '', // Not needed for display
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
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
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

    let filtered = [...messages];

    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [messages, searchQuery]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { subject: string; content: string; recipientId?: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          subject: messageData.subject,
          content: messageData.content,
          recipient_id: messageData.recipientId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      setIsComposeOpen(false);
      setNewMessage({ subject: "", content: "", recipientId: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["messages"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark as read",
        variant: "destructive",
      });
    }
  };

  const unreadCount = React.useMemo(() => {
    return messages?.filter(m => m.recipient_id === user?.id && !m.is_read).length || 0;
  }, [messages, user?.id]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" onClick={() => setActiveTab("inbox")}>
              Inbox {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="sent" onClick={() => setActiveTab("sent")}>
              Sent
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <TabsContent value="inbox" className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
            ) : filteredMessages?.filter(message => message.recipient_id === user?.id).length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your inbox is empty
                </p>
              </div>
            ) : (
              filteredMessages
                ?.filter(message => message.recipient_id === user?.id)
                .map(message => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      !message.is_read 
                        ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {!message.is_read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                          <span className="font-semibold">
                            {message.subject || 'No Subject'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From: <span className="font-medium text-foreground">
                            {message.sender?.first_name} {message.sender?.last_name}
                          </span>
                        </div>
                        <p className="text-sm">
                          {message.content.length > 150 
                            ? message.content.substring(0, 150) + '...' 
                            : message.content}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!message.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(message.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
            ) : filteredMessages?.filter(message => message.sender_id === user?.id).length === 0 ? (
              <div className="text-center py-12">
                <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No sent messages</h3>
                <p className="text-sm text-muted-foreground">
                  Messages you send will appear here
                </p>
              </div>
            ) : (
              filteredMessages
                ?.filter(message => message.sender_id === user?.id)
                .map(message => {
                  const recipient = users.find(u => u.id === message.recipient_id);
                  return (
                    <div
                      key={message.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="font-semibold">
                          {message.subject || 'No Subject'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          To: <span className="font-medium text-foreground">
                            {recipient 
                              ? `${recipient.first_name} ${recipient.last_name} (${recipient.role})`
                              : 'Unknown Recipient'}
                          </span>
                        </div>
                        <p className="text-sm">
                          {message.content.length > 150 
                            ? message.content.substring(0, 150) + '...' 
                            : message.content}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                New Message
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">
                  To <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={newMessage.recipientId}
                  onValueChange={(value) => setNewMessage({...newMessage, recipientId: value})}
                >
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No staff available
                      </div>
                    ) : (
                      users.map(recipient => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {recipient.first_name} {recipient.last_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {recipient.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Enter subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsComposeOpen(false);
                    setNewMessage({ subject: "", content: "", recipientId: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendMessageMutation.mutate(newMessage)}
                  disabled={
                    sendMessageMutation.isPending || 
                    !newMessage.recipientId || 
                    !newMessage.subject || 
                    !newMessage.content
                  }
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
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
