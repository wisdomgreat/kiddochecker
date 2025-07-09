
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, RotateCcw, Users } from "lucide-react";
import { useStaffInvitations } from "@/hooks/useStaffInvitations";

export function StaffInvitationsList() {
  const { invitations, isLoading, resendInvitation, isResending } = useStaffInvitations();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No staff invitations sent yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">
                          {invitation.first_name} {invitation.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{invitation.email}</p>
                        <p className="text-sm text-gray-500 capitalize">{invitation.role}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={getStatusColor(invitation.status)}>
                        {invitation.status}
                      </Badge>
                      {isExpired(invitation.expires_at) && invitation.status === 'pending' && (
                        <Badge className="bg-red-100 text-red-800">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {invitation.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitation(invitation.id)}
                        disabled={isResending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  Sent: {new Date(invitation.created_at).toLocaleDateString()}
                  {invitation.status === 'pending' && (
                    <span className="ml-4">
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
