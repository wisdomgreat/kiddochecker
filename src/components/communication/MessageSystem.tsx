import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Filter,
  Mail,
  MailOpen,
  Reply,
  Forward,
  Trash2,
  Star,
  Clock
} from "lucide-react";
import { useAuth } from "@/context/CleanAuthContext";

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
  };
}

const MessageSystem = () => {
  const [selectedTab, setSelectedTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error, refetch } = useQuery({
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

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      subject?: string;
      content: string;
      recipient_id?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject,
          content: messageData.content,
          recipient_id: messageData.recipient_id || null,
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
      setRecipient("");
      setSubject("");
      setContent("");
    },
    onError: (error: any) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const filteredMessages = messages.filter(msg => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(searchTerm) ||
      msg.content.toLowerCase().includes(searchTerm) ||
      msg.sender?.first_name?.toLowerCase().includes(searchTerm) ||
      msg.sender?.last_name?.toLowerCase().includes(searchTerm)
    );
  });

  const inboxMessages = filteredMessages.filter(msg => msg.recipient_id === user?.id);
  const sentMessages = filteredMessages.filter(msg => msg.sender_id === user?.id);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Family Connect</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-64"
            />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="p-4">
            <TabsTrigger value="inbox" onClick={() => setSelectedTab("inbox")}>
              <MailOpen className="h-4 w-4 mr-2" /> Inbox <Badge className="ml-2">{inboxMessages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sent" onClick={() => setSelectedTab("sent")}>
              <Send className="h-4 w-4 mr-2" /> Sent
            </TabsTrigger>
            <TabsTrigger value="compose" onClick={() => setIsComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Compose
            </TabsTrigger>
          </TabsList>
          <Separator />
          <TabsContent value="inbox" className="p-4">
            <ScrollArea className="h-[400px] w-full">
              {isLoading ? (
                <p>Loading messages...</p>
              ) : error ? (
                <p>Error: {error.message}</p>
              ) : inboxMessages.length === 0 ? (
                <p>No messages in inbox.</p>
              ) : (
                <div className="space-y-3">
                  {inboxMessages.map(message => (
                    <Card key={message.id} className="shadow-sm">
                      <CardContent className="flex items-start justify-between p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{message.subject || "No Subject"}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            From: {message.sender?.first_name} {message.sender?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {message.content.length > 100 ? message.content.substring(0, 100) + "..." : message.content}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(message.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Reply className="h-4 w-4 mr-2" /> Reply
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Forward className="h-4 w-4 mr-2" /> Forward
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="sent" className="p-4">
            <ScrollArea className="h-[400px] w-full">
              {isLoading ? (
                <p>Loading messages...</p>
              ) : error ? (
                <p>Error: {error.message}</p>
              ) : sentMessages.length === 0 ? (
                <p>No messages sent.</p>
              ) : (
                <div className="space-y-3">
                  {sentMessages.map(message => (
                    <Card key={message.id} className="shadow-sm">
                      <CardContent className="flex items-start justify-between p-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{message.subject || "No Subject"}</span>
                          </div>
                          <p className="text-sm text-gray-500">
                            To: {message.recipient_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {message.content.length > 100 ? message.content.substring(0, 100) + "..." : message.content}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(message.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Compose New Message</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                To
              </Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="content" className="text-right">
                Message
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3 min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setIsComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                sendMessageMutation.mutate({
                  recipient_id: recipient,
                  subject: subject,
                  content: content,
                })
              }
              disabled={sendMessageMutation.isLoading}
            >
              {sendMessageMutation.isLoading ? (
                <>
                  Sending...
                </>
              ) : (
                <>
                  Send <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageSystem;
