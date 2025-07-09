
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Users, 
  AlertCircle,
  CheckCircle,
  Clock,
  Mail
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  recipient_id: string;
  sender_id: string;
  subject: string;
  updated_at: string;
  sender?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  recipient?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

const FamilyConnectPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Compose form state
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchMessages(),
        fetchRecipients()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching messages for user:', user.id);
      
      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found');
        setMessages([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.recipient_id).filter(Boolean)
      ])];

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Get emails
      const { data: authUsers } = await supabase
        .from('auth_users_with_emails')
        .select('id, email')
        .in('id', userIds);

      // Combine data
      const messagesWithProfiles = messagesData.map(message => {
        const senderProfile = profiles?.find(p => p.id === message.sender_id);
        const senderAuth = authUsers?.find(a => a.id === message.sender_id);
        const recipientProfile = profiles?.find(p => p.id === message.recipient_id);
        const recipientAuth = authUsers?.find(a => a.id === message.recipient_id);

        return {
          ...message,
          sender: senderProfile || senderAuth ? {
            first_name: senderProfile?.first_name,
            last_name: senderProfile?.last_name,
            email: senderAuth?.email
          } : undefined,
          recipient: recipientProfile || recipientAuth ? {
            first_name: recipientProfile?.first_name,
            last_name: recipientProfile?.last_name,
            email: recipientAuth?.email
          } : undefined
        };
      });

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const fetchRecipients = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching recipients for user:', user.id);
      
      // Get all user roles except current user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }

      if (!userRoles || userRoles.length === 0) {
        console.log('No other users found');
        setRecipients([]);
        return;
      }

      const userIds = userRoles.map(ur => ur.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Get emails
      const { data: authUsers } = await supabase
        .from('auth_users_with_emails')
        .select('id, email')
        .in('id', userIds);

      // Combine data
      const combinedData: UserProfile[] = userRoles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        const authUser = authUsers?.find(au => au.id === role.user_id);
        
        return {
          id: role.user_id,
          email: authUser?.email || 'Unknown',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          role: role.role
        };
      }).filter(user => user.email !== 'Unknown'); // Filter out users without emails

      console.log('Combined recipients data:', combinedData);
      setRecipients(combinedData);
    } catch (error) {
      console.error('Error in fetchRecipients:', error);
      toast({
        title: "Error",
        description: "Failed to load recipients",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user!.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content,
          is_read: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });

      setNewMessage({ recipient_id: '', subject: '', content: '' });
      setActiveTab('inbox');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getDisplayName = (profile?: { first_name?: string; last_name?: string; email?: string }) => {
    if (!profile) return 'Unknown User';
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email || 'Unknown User';
  };

  const unreadCount = messages.filter(msg => msg.recipient_id === user?.id && !msg.is_read).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Connect</h1>
            <p className="text-muted-foreground">
              Communicate with staff, teachers, and other parents.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={unreadCount > 0 ? "default" : "outline"}>
              {unreadCount} unread
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'inbox' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('inbox')}
            className="flex items-center gap-2"
          >
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'compose' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('compose')}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Compose
          </Button>
        </div>

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">No messages yet</h3>
                  <p className="text-gray-600 mb-6">Start a conversation by composing a new message</p>
                  <Button onClick={() => setActiveTab('compose')}>
                    <Send className="h-4 w-4 mr-2" />
                    Compose Message
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isReceived = message.recipient_id === user?.id;
                    const otherUser = isReceived ? message.sender : message.recipient;
                    
                    return (
                      <div
                        key={message.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isReceived && !message.is_read 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (isReceived && !message.is_read) {
                            markAsRead(message.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isReceived ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {isReceived ? <Mail className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-medium">
                                {isReceived ? 'From' : 'To'}: {getDisplayName(otherUser)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isReceived && !message.is_read && (
                              <Badge variant="default" className="text-xs">
                                New
                              </Badge>
                            )}
                            {isReceived ? (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        
                        <h4 className="font-semibold mb-2">{message.subject}</h4>
                        <p className="text-gray-700 text-sm">{message.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <Select 
                  value={newMessage.recipient_id} 
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                        No recipients available
                      </div>
                    ) : (
                      recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {getDisplayName(recipient)} 
                              <span className="text-xs text-gray-500 ml-2">({recipient.role})</span>
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  placeholder="Enter message subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>

              <Button 
                onClick={sendMessage}
                disabled={sending || !newMessage.recipient_id || !newMessage.subject || !newMessage.content}
                className="w-full"
              >
                {sending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default FamilyConnectPage;
