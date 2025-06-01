
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, School } from "lucide-react";

interface ClassStatusProps {
  className?: string;
}

const ClassStatus = ({ className }: ClassStatusProps) => {
  // Mock data - in a real app this would come from props or a hook
  const classes = [
    {
      id: "1",
      name: "Toddler Class",
      currentCount: 8,
      capacity: 12,
      teacher: "Sarah Williams",
      room: "Room A",
    },
    {
      id: "2",
      name: "Elementary Class", 
      currentCount: 15,
      capacity: 20,
      teacher: "John Smith",
      room: "Room B",
    },
    {
      id: "3",
      name: "Youth Group",
      currentCount: 12,
      capacity: 15,
      teacher: "Emily Johnson",
      room: "Room C",
    },
  ];

  const getCapacityStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 90) return { status: "full", color: "bg-red-500" };
    if (percentage >= 75) return { status: "high", color: "bg-yellow-500" };
    return { status: "normal", color: "bg-green-500" };
  };

  if (classes.length === 0) {
    return (
      <div className="text-center py-6">
        <School className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No active classes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Class information will appear here when available
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {classes.map((classInfo) => {
        const capacityInfo = getCapacityStatus(classInfo.currentCount, classInfo.capacity);
        
        return (
          <div key={classInfo.id} className="p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{classInfo.name}</h4>
                <p className="text-sm text-gray-500">{classInfo.teacher} • {classInfo.room}</p>
              </div>
              <Badge 
                variant={capacityInfo.status === 'normal' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <Users className="h-3 w-3" />
                {classInfo.currentCount}/{classInfo.capacity}
              </Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${capacityInfo.color}`}
                style={{ width: `${(classInfo.currentCount / classInfo.capacity) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClassStatus;
