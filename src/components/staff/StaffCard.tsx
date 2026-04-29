
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Shield, User, Edit, Trash2 } from 'lucide-react';
import { StaffMember } from '@/hooks/useStaffManagement';

interface StaffCardProps {
  member: StaffMember;
  onEdit?: (member: StaffMember) => void;
  onDelete?: (memberId: string) => void;
}

const StaffCard = ({ member, onEdit, onDelete }: StaffCardProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'teacher_assistant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {member.first_name} {member.last_name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getRoleBadgeColor(member.role)}>
                  {member.role.replace('_', ' ')}
                </Badge>
                {member.is_super_admin && (
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
                {member.is_volunteer && (
                  <Badge variant="outline">Volunteer</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(member)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(member.user_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            {member.email}
          </div>
          {member.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {member.phone}
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;

