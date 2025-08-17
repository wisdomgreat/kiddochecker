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
  firstName: string;
  lastName: string;
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
    firstName?: string;
    lastName?: string;
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
          .select('*, sender:sender_id(firstName, lastName)')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return [];
        }

        return messagesData || [];
      } catch (error: any) {
        console.error("Error in useMessages:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, firstName, lastName, email, role');

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          return;
        }

        setUsers(profiles || []);
      } catch (error: any) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const filteredMessages = React.useMemo(() => {
    if (!messages) return [];

    let filtered = [...messages];

    if (searchQuery) {
      filtered = filtered.filter(message =>
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sender?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" onClick={() => setActiveTab("inbox")}>Inbox</TabsTrigger>
            <TabsTrigger value="sent" onClick={() => setActiveTab("sent")}>Sent</TabsTrigger>
          </TabsList>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
          <TabsContent value="inbox">
            <div className="space-y-2">
              {filteredMessages
                ?.filter(message => message.recipient_id === user?.id)
                .map(message => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-md border ${!message.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{message.subject || 'No Subject'}</div>
                        <div className="text-sm text-gray-500">
                          From: {message.sender?.firstName} {message.sender?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}
                        </div>
                      </div>
                      <div>
                        {!message.is_read && (
                          <Button variant="outline" size="xs" onClick={() => markAsRead(message.id)}>
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="sent">
            <div className="space-y-2">
              {filteredMessages
                ?.filter(message => message.sender_id === user?.id)
                .map(message => (
                  <div
                    key={message.id}
                    className="p-3 rounded-md border bg-gray-50 border-gray-200"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{message.subject || 'No Subject'}</div>
                      <div className="text-sm text-gray-500">To: {message.recipient_id}</div>
                      <div className="text-sm text-gray-500">
                        {message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient" className="text-right">
                  To
                </Label>
                <Select onValueChange={(value) => setNewMessage({...newMessage, recipientId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} - {user.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="content" className="text-right">
                  Message
                </Label>
                <Textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <Button 
                onClick={() => sendMessageMutation.mutate(newMessage)}
                disabled={sendMessageMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MessageSystem;
