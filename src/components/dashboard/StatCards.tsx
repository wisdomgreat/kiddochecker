
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, UserX, School, AlertTriangle, Loader2 } from "lucide-react";

interface StatCardsProps {
  stats: {
    checkedIn: number;
    checkedOut: number;
    classes: number;
    alerts: number;
  };
  isLoading: boolean;
}

const StatCards = ({ stats, isLoading }: StatCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6 flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-green-100 rounded-l-full" />
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Checked In</p>
              <h3 className="text-3xl font-bold">{stats.checkedIn}</h3>
              <p className="text-sm text-gray-500 mt-1">Children present</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-blue-100 rounded-l-full" />
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Checked Out</p>
              <h3 className="text-3xl font-bold">{stats.checkedOut}</h3>
              <p className="text-sm text-gray-500 mt-1">Children departed</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <UserX className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-purple-100 rounded-l-full" />
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Classes</p>
              <h3 className="text-3xl font-bold">{stats.classes}</h3>
              <p className="text-sm text-gray-500 mt-1">Active classes</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <School className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-amber-100 rounded-l-full" />
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Alerts</p>
              <h3 className="text-3xl font-bold">{stats.alerts}</h3>
              <p className="text-sm text-gray-500 mt-1">Requiring attention</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
