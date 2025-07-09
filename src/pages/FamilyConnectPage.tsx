
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  Inbox, 
  Mail, 
  Users, 
  Info,
  MessageCircle,
  Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const FamilyConnectPage = () => {
  const { user, userRole } = useAuth();
  const { messages, sendMessage, isSending } = useMessages();
  const [activeTab, setActiveTab] = useState('inbox');
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipient_id: ''
  });

  // Fetch available recipients based on user role
  const { data: availableRecipients = [] } = useQuery({
    queryKey: ['available-recipients', userRole],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        if (userRole === 'parent') {
          // Parents can message admins and staff
          const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('role', ['admin', 'super_admin', 'staff', 'teacher']);
          
          if (userRolesError) {
            console.error('Error fetching user roles for parent:', userRolesError);
            return [];
          }

          if (!userRoles || userRoles.length === 0) return [];

          // Get profiles for these users
          const userIds = userRoles.map(ur => ur.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles for parent:', profilesError);
            return [];
          }

          // Combine user roles with profiles
          return userRoles.map(userRole => {
            const profile = profiles?.find(p => p.id === userRole.user_id);
            return {
              id: userRole.user_id,
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User' : 'Unnamed User',
              role: userRole.role
            };
          });
        } else {
          // Staff/admins can message parents and other staff
          const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .neq('user_id', user.id);
          
          if (userRolesError) {
            console.error('Error fetching user roles for staff:', userRolesError);
            return [];
          }

          if (!userRoles || userRoles.length === 0) return [];

          // Get profiles for these users
          const userIds = userRoles.map(ur => ur.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles for staff:', profilesError);
            return [];
          }

          // Combine user roles with profiles
          return userRoles.map(userRole => {
            const profile = profiles?.find(p => p.id === userRole.user_id);
            return {
              id: userRole.user_id,
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User' : 'Unnamed User',
              role: userRole.role
            };
          });
        }
      } catch (error) {
        console.error('Error in recipients query:', error);
        return [];
      }
    },
    enabled: !!user
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !newMessage.recipient_id) return;

    try {
      await sendMessage({
        subject: newMessage.subject || 'No Subject',
        content: newMessage.content,
        recipient_id: newMessage.recipient_id
      });
      
      setNewMessage({ subject: '', content: '', recipient_id: '' });
      setActiveTab('inbox');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const sentMessages = messages.filter(msg => msg.sender_id === user?.id);
  const receivedMessages = messages.filter(msg => msg.recipient_id === user?.id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Family Connect</h1>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How Family Connect works:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Parents can send messages to administrators and staff members</li>
              <li>Staff and administrators can communicate with parents and other staff</li>
              <li>Select a specific recipient from the dropdown - messages are private, not broadcast</li>
              <li>Check your inbox regularly for new messages and replies</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Inbox ({receivedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent ({sentMessages.length})
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Compose
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Received Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {receivedMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages received yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{message.subject}</h4>
                            {!message.is_read && (
                              <Badge variant="secondary">New</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {message.sender?.first_name} {message.sender?.last_name}
                        </p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sent Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentMessages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{message.subject}</h4>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          To: {availableRecipients.find(r => r.id === message.recipient_id)?.name || 'Unknown Recipient'}
                        </p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compose">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient *</label>
                    <Select value={newMessage.recipient_id} onValueChange={(value) => 
                      setNewMessage(prev => ({ ...prev, recipient_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRecipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter message subject"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message *</label>
                    <Textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Type your message here..."
                      rows={6}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSending || !newMessage.content.trim() || !newMessage.recipient_id}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
