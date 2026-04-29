
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, MapPin } from "lucide-react";
import { Class } from "@/types/classes";

interface ClassCardProps {
  classItem: Class;
  onEdit: (classItem: Class) => void;
  onDelete: (classId: string) => void;
  showActions?: boolean;
  attendanceCount?: number;
}

const ClassCard = ({ 
  classItem, 
  onEdit, 
  onDelete, 
  showActions = true,
  attendanceCount = 0
}: ClassCardProps) => {
  const capacityPercentage = classItem.capacity 
    ? Math.round((attendanceCount / classItem.capacity) * 100)
    : 0;

  const getCapacityColor = () => {
    if (capacityPercentage >= 90) return "text-red-600";
    if (capacityPercentage >= 75) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2 flex-1">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">{classItem.name}</CardTitle>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(classItem)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(classItem.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {classItem.description && (
            <p className="text-sm text-gray-600">{classItem.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Age Range:</span>
            <Badge variant="secondary">{classItem.age_range || 'Not specified'}</Badge>
          </div>
          
          {classItem.room && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Room:</span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span className="text-sm">{classItem.room}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Attendance:</span>
            <div className={`text-sm font-medium ${getCapacityColor()}`}>
              {attendanceCount}
              {classItem.capacity && ` / ${classItem.capacity}`}
              {classItem.capacity && ` (${capacityPercentage}%)`}
            </div>
          </div>
          
          {classItem.capacity && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  capacityPercentage >= 90 
                    ? 'bg-red-500' 
                    : capacityPercentage >= 75 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;

