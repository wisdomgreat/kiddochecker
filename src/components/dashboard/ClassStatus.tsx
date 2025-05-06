
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClassItem {
  id: string;
  name: string;
  room: string;
  capacity: number;
  checkedIn: number;
  checkedOut: number;
  remaining: number;
}

interface ClassStatusProps {
  classData: ClassItem[];
  isLoading: boolean;
}

const ClassStatus = ({ classData, isLoading }: ClassStatusProps) => {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <RefreshCcw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
            <span>Loading class information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!classData || classData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No classes active today</h3>
            <p className="text-sm text-gray-500 mb-4">
              There are no classes scheduled or active for today
            </p>
            <Button onClick={() => navigate('/classes-management')}>
              Manage Classes
            </Button>
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
          Class Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {classData.map((classItem) => {
            const occupancyPercent = classItem.capacity > 0 
              ? Math.round((classItem.checkedIn - classItem.checkedOut) / classItem.capacity * 100)
              : 0;
              
            let statusColor = "bg-green-100 text-green-800";
            if (occupancyPercent > 90) {
              statusColor = "bg-red-100 text-red-800";
            } else if (occupancyPercent > 75) {
              statusColor = "bg-amber-100 text-amber-800";
            }

            return (
              <div key={classItem.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{classItem.name}</h3>
                    <p className="text-sm text-gray-500">Room: {classItem.room}</p>
                  </div>
                  <Badge className={statusColor}>
                    {classItem.checkedIn - classItem.checkedOut} / {classItem.capacity}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Occupancy</span>
                    <span>{occupancyPercent}%</span>
                  </div>
                  <Progress value={occupancyPercent} className="h-2" />
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm">
                  <div className="text-gray-500">
                    <span className="text-green-600 font-medium">{classItem.checkedIn}</span> checked in,
                    <span className="text-blue-600 font-medium ml-1">{classItem.checkedOut}</span> checked out
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/class/${classItem.id}`)}>
                    View
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassStatus;
