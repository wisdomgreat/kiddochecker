
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Recipient {
  id: string;
  name: string;
  role: string;
}

const FamilyConnectPage = () => {
  const { user, userRole } = useAuth();
  const { messages, sendMessage, isSending } = useMessages();
  const { toast } = useToast();
  
  const [messageData, setMessageData] = useState({
    subject: '',
    content: '',
    recipientId: ''
  });
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  // Fetch available recipients based on user role
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!user || !userRole) return;
      
      setIsLoadingRecipients(true);
      try {
        if (userRole === 'parent') {
          // Parents can message admins, staff, and teachers
          const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('role', ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']);
          
          if (userRolesError) {
            console.error('Error fetching user roles for parent:', userRolesError);
            setRecipients([]);
            return;
          }

          if (!userRoles || userRoles.length === 0) {
            setRecipients([]);
            return;
          }

          // Get profiles for these users
          const userIds = userRoles.map(ur => ur.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles for parent:', profilesError);
            setRecipients([]);
            return;
          }

          // Combine user roles with profiles
          const recipientList = userRoles.map(userRole => {
            const profile = profiles?.find(p => p.id === userRole.user_id);
            return {
              id: userRole.user_id,
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User' : 'Unnamed User',
              role: userRole.role
            };
          });
          
          setRecipients(recipientList);
        } else {
          // Staff/admins can message everyone except themselves
          const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .neq('user_id', user.id);
          
          if (userRolesError) {
            console.error('Error fetching user roles for staff:', userRolesError);
            setRecipients([]);
            return;
          }

          if (!userRoles || userRoles.length === 0) {
            setRecipients([]);
            return;
          }

          // Get profiles for these users
          const userIds = userRoles.map(ur => ur.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles for staff:', profilesError);
            setRecipients([]);
            return;
          }

          // Combine user roles with profiles
          const recipientList = userRoles.map(userRole => {
            const profile = profiles?.find(p => p.id === userRole.user_id);
            return {
              id: userRole.user_id,
              name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User' : 'Unnamed User',
              role: userRole.role
            };
          });
          
          setRecipients(recipientList);
        }
      } catch (error) {
        console.error('Error in recipients query:', error);
        setRecipients([]);
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, [user, userRole]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageData.content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (!messageData.recipientId) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessage({
        subject: messageData.subject || 'No Subject',
        content: messageData.content,
        recipient_id: messageData.recipientId,
      });
      
      setMessageData({ subject: '', content: '', recipientId: '' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'teacher_assistant':
        return 'bg-teal-100 text-teal-800';
      case 'parent':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Family Connect</h1>
            <p className="text-muted-foreground">
              Send messages to staff, teachers, and other parents in your community.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Recipient *</label>
                  {isLoadingRecipients ? (
                    <div className="text-sm text-gray-500">Loading recipients...</div>
                  ) : (
                    <Select 
                      value={messageData.recipientId} 
                      onValueChange={(value) => setMessageData({ ...messageData, recipientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{recipient.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`ml-2 text-xs ${getRoleBadgeColor(recipient.role)}`}
                              >
                                {recipient.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                        {recipients.length === 0 && (
                          <SelectItem value="no-recipients" disabled>
                            No recipients available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    placeholder="Enter message subject (optional)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message *</label>
                  <Textarea
                    value={messageData.content}
                    onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                    placeholder="Type your message here..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSending || !messageData.recipientId || !messageData.content.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>

              {recipients.length === 0 && !isLoadingRecipients && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <h4 className="font-medium text-amber-800">No recipients available</h4>
                      <p className="text-sm text-amber-700">
                        Contact your administrator to set up messaging permissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.slice(0, 5).map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{message.subject || 'No Subject'}</h4>
                        <Badge variant="outline" className="text-xs">
                          {message.sender?.first_name} {message.sender?.last_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {message.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation by sending your first message</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
