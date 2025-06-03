
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, User, Phone, Mail } from "lucide-react";
import { StaffMember } from "@/hooks/useStaff";

interface StaffCardProps {
  staff: StaffMember;
  onEdit: (staff: StaffMember) => void;
}

const StaffCard = ({ staff, onEdit }: StaffCardProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'teacher_assistant':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2 flex-1">
          <User className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">
            {staff.first_name} {staff.last_name}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(staff)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor(staff.role)}>
              {staff.role.replace('_', ' ')}
            </Badge>
            {staff.is_volunteer && (
              <Badge variant="outline">Volunteer</Badge>
            )}
            {staff.is_super_admin && (
              <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              {staff.email}
            </div>
            
            {staff.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {staff.phone}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-500">
              Status: {staff.is_active ? 'Active' : 'Inactive'}
            </span>
            <div className={`w-2 h-2 rounded-full ${staff.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;
