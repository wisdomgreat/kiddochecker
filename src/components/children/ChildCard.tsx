
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Child } from "@/hooks/useChildren";

interface ChildCardProps {
  child: Child;
  onEdit?: (child: Child) => void;
  onDelete?: (childId: string) => void;
  onUpdate?: () => void;
  showActions?: boolean;
}

const ChildCard = ({ child, onEdit, onDelete, onUpdate, showActions = true }: ChildCardProps) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(child);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(child.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {child.first_name?.charAt(0) || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">
            {child.first_name} {child.last_name}
          </CardTitle>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {child.age && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age:</span>
              <Badge variant="secondary">{child.age} years</Badge>
            </div>
          )}
          
          {child.allergies && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Allergies:</span>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {child.allergies}
              </p>
            </div>
          )}
          
          {child.medical_info && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Medical Info:</span>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {child.medical_info}
              </p>
            </div>
          )}
          
          {child.emergency_contact_name && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-700">Emergency Contact:</span>
              <div className="text-sm text-gray-600">
                <p>{child.emergency_contact_name}</p>
                {child.emergency_contact_phone && (
                  <p className="text-blue-600">{child.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;
