
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, UserCheck, TrendingUp } from "lucide-react";

export interface StatCardsProps {
  stats?: {
    totalChildren?: number;
    totalClasses?: number;
    checkedIn?: number;
    totalStaff?: number;
  };
  isLoading?: boolean;
}

const StatCards = ({ stats, isLoading }: StatCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-20 ml-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <Users className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-sm font-medium ml-2">Total Children</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalChildren || 0}</div>
          <p className="text-xs text-muted-foreground">Registered children</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <GraduationCap className="h-4 w-4 text-green-600" />
          <CardTitle className="text-sm font-medium ml-2">Active Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
          <p className="text-xs text-muted-foreground">Running classes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <UserCheck className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-sm font-medium ml-2">Present Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.checkedIn || 0}</div>
          <p className="text-xs text-muted-foreground">Currently checked in</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <TrendingUp className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-sm font-medium ml-2">Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalStaff || 0}</div>
          <p className="text-xs text-muted-foreground">Active staff</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
