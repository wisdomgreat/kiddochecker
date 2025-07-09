
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, Search, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    content: ''
  });
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for user:', user?.id);
      
      // First get the messages without the join
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      console.log('Raw messages data:', messagesData);

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found');
        setMessages([]);
        return;
      }

      // Get unique user IDs from messages
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.recipient_id).filter(Boolean)
      ])];

      console.log('User IDs to fetch profiles for:', userIds);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get emails from auth_users_with_emails view
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users_with_emails')
        .select('id, email')
        .in('id', userIds);

      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      console.log('Profiles data:', profiles);
      console.log('Auth users data:', authUsers);

      // Combine the data
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

      console.log('Final messages with profiles:', messagesWithProfiles);
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      console.log('Fetching recipients, current user role:', userRole);
      
      // Get user roles first
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError);
        return;
      }

      console.log('User roles data:', userRoles);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      console.log('Profiles data:', profiles);

      // Get emails from auth.users (using the view)
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users_with_emails')
        .select('id, email');

      if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
      }

      console.log('Auth users data:', authUsers);

      // Combine the data
      const combinedData: UserProfile[] = userRoles
        .filter(role => role.user_id !== user?.id) // Exclude current user
        .map(role => {
          const profile = profiles?.find(p => p.id === role.user_id);
          const authUser = authUsers?.find(au => au.id === role.user_id);
          
          return {
            id: role.user_id,
            email: authUser?.email || 'No email',
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            role: role.role
          };
        })
        .filter(user => {
          // Filter based on current user's role
          if (userRole === 'parent') {
            // Parents can message staff, teachers, and admins
            return ['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin'].includes(user.role);
          } else if (['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant'].includes(userRole || '')) {
            // Staff can message anyone
            return true;
          }
          return false;
        });

      console.log('Combined recipients data:', combinedData);
      setRecipients(combinedData);
    } catch (error) {
      console.error('Error in fetchRecipients:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMessages(), fetchRecipients()]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, userRole]);

  const filteredRecipients = recipients.filter(recipient => {
    const fullName = `${recipient.first_name || ''} ${recipient.last_name || ''}`.toLowerCase();
    const email = recipient.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || recipient.role.toLowerCase().includes(search);
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          content: newMessage.content
        });

      if (error) throw error;

      setNewMessage({ recipient_id: '', subject: '', content: '' });
      await fetchMessages();
      
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      await fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'teacher':
      case 'teacher_assistant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'parent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Connect</h1>
            <p className="text-gray-600 mt-1">Connect with teachers, staff, and other parents</p>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {messages.filter(m => !m.is_read && m.recipient_id === user?.id).length} Unread
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send New Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search and Select Recipient</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({...newMessage, recipient_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredRecipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>
                                {recipient.first_name && recipient.last_name 
                                  ? `${recipient.first_name} ${recipient.last_name}` 
                                  : recipient.email}
                              </span>
                              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(recipient.role)}`}>
                                {recipient.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    placeholder="Enter message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">No messages yet</h3>
                  <p className="text-gray-600">Start a conversation by sending your first message!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        !message.is_read && message.recipient_id === user?.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (!message.is_read && message.recipient_id === user?.id) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{message.subject}</h4>
                          <p className="text-sm text-gray-600">
                            {message.sender_id === user?.id ? 'To: ' : 'From: '}
                            {message.sender_id === user?.id 
                              ? (message.recipient?.first_name && message.recipient?.last_name
                                  ? `${message.recipient.first_name} ${message.recipient.last_name}`
                                  : message.recipient?.email || 'Unknown')
                              : (message.sender?.first_name && message.sender?.last_name
                                  ? `${message.sender.first_name} ${message.sender.last_name}`
                                  : message.sender?.email || 'Unknown')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!message.is_read && message.recipient_id === user?.id && (
                            <Badge variant="default" className="bg-blue-600 text-white">
                              New
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FamilyConnectPage;
