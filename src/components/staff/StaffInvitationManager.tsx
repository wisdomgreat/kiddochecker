
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useStaffInvitations } from '@/hooks/useStaffInvitations';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { Mail, Send, RefreshCw, UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AppRole } from '@/types/supabase';

const StaffInvitationManager = () => {
  const { toast } = useToast();
  const { invitations, isLoading, resendInvitation, isResending } = useStaffInvitations();
  const { addStaff, isAddingStaff } = useStaffManagement();

  const [newStaff, setNewStaff] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff' as AppRole,
    is_volunteer: false
  });

  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.first_name || !newStaff.last_name) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addStaff(newStaff);
      setNewStaff({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff' as AppRole,
        is_volunteer: false
      });
    } catch (error) {
      console.error('Error adding staff:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Add New Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={newStaff.first_name}
                onChange={(e) => setNewStaff({ ...newStaff, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={newStaff.last_name}
                onChange={(e) => setNewStaff({ ...newStaff, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newStaff.role} onValueChange={(value: AppRole) => setNewStaff({ ...newStaff, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="is_volunteer"
                checked={newStaff.is_volunteer}
                onChange={(e) => setNewStaff({ ...newStaff, is_volunteer: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <Label htmlFor="is_volunteer">Volunteer Position</Label>
            </div>
          </div>

          <Button 
            onClick={handleAddStaff} 
            disabled={isAddingStaff}
            className="w-full md:w-auto"
          >
            {isAddingStaff ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Adding Staff...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff Member
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Staff Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Staff Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading invitations...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No staff invitations sent yet</p>
              <p className="text-sm">Invitations will appear here when you add new staff members</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{invitation.first_name} {invitation.last_name}</p>
                        <p className="text-sm text-gray-600">{invitation.email}</p>
                        <p className="text-xs text-gray-500">
                          Role: {invitation.role} • Sent: {formatDate(invitation.created_at)}
                        </p>
                        {invitation.expires_at && (
                          <p className="text-xs text-gray-500">
                            Expires: {formatDate(invitation.expires_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(invitation.status)}
                    {invitation.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitation(invitation.id)}
                        disabled={isResending}
                      >
                        {isResending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Resend
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffInvitationManager;

