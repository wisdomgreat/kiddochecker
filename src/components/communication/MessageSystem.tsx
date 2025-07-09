
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Bell, 
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

interface MessageSystemProps {
  isStaffView?: boolean;
}

const MessageSystem: React.FC<MessageSystemProps> = ({ isStaffView = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipient_id: '',
    type: 'general' as 'general' | 'emergency'
  });
  const [showCompose, setShowCompose] = useState(false);
  const [recipients, setRecipients] = useState<Array<{id: string, name: string}>>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load messages
  useEffect(() => {
    loadMessages();
    loadRecipients();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    try {
      // First, get messages without the join
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        return;
      }

      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      
      // Get sender profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      // Combine the data
      const messagesWithSenders = messagesData.map(message => ({
        ...message,
        sender: profiles?.find(profile => profile.id === message.sender_id)
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadRecipients = async () => {
    if (!user) return;

    try {
      // Load all users for staff, or just staff for parents
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .neq('id', user.id);

      if (error) throw error;
      
      const recipientList = (data || []).map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
      }));

      setRecipients(recipientList);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const messageData = {
        sender_id: user.id,
        recipient_id: newMessage.recipient_id || null,
        subject: newMessage.subject.trim(),
        content: newMessage.content.trim(),
        is_read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage({
        subject: '',
        content: '',
        recipient_id: '',
        type: 'general'
      });
      setShowCompose(false);
      loadMessages();

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendEmergencyAlert = async () => {
    if (!user) return;

    try {
      const alertData = {
        sender_id: user.id,
        recipient_id: null, // Broadcast to all
        subject: 'EMERGENCY ALERT',
        content: 'This is an emergency notification. Please check with staff immediately.',
        is_read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(alertData);

      if (error) throw error;

      loadMessages();
      toast({
        title: "Emergency Alert Sent",
        description: "Emergency notification has been broadcast to all users",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send emergency alert",
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter(msg => 
    msg.recipient_id === user?.id && !msg.is_read
  ).length;

  const sentMessages = messages.filter(msg => msg.sender_id === user?.id);
  const receivedMessages = messages.filter(msg => msg.recipient_id === user?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Messages</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCompose(true)}>
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
          {isStaffView && (
            <Button 
              variant="destructive"
              onClick={sendEmergencyAlert}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Alert
            </Button>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">To</label>
                <select
                  value={newMessage.recipient_id}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Broadcast to all</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={4}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={sendMessage} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompose(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Received Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Received Messages ({receivedMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {receivedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    message.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{message.subject}</h4>
                      {!message.is_read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>
                      From: {message.sender ? 
                        `${message.sender.first_name} ${message.sender.last_name}` : 
                        'Unknown Sender'}
                    </span>
                  </div>
                </div>
              ))}
              {receivedMessages.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No messages received
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Sent Messages ({sentMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sentMessages.map((message) => (
                <div key={message.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{message.subject}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{message.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>
                      To: {message.recipient_id ? 'Individual' : 'Broadcast'}
                    </span>
                  </div>
                </div>
              ))}
              {sentMessages.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No messages sent
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessageSystem;
