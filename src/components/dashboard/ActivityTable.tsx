
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, RefreshCcw } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  date: string;
  user: string;
}

interface ActivityTableProps {
  activityData: ActivityItem[];
  isLoading: boolean;
}

const ActivityTable = ({ activityData, isLoading }: ActivityTableProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <RefreshCcw className="h-6 w-6 animate-spin text-purple-600 mr-2" />
            <span>Loading activity data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!activityData || activityData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
            <p className="text-sm text-gray-500">
              Activity will appear here as children are checked in and out
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) {
        return "Today";
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (e) {
      return dateStr;
    }
  };
  
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (e) {
      return "Unknown time";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3">Action</th>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {activityData.map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Badge 
                      className={
                        activity.action === 'checked-in' 
                          ? 'bg-green-100 text-green-800 flex items-center gap-1' 
                          : 'bg-blue-100 text-blue-800 flex items-center gap-1'
                      }
                    >
                      {activity.action === 'checked-in' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {activity.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{activity.description}</td>
                  <td className="px-4 py-3">{activity.user}</td>
                  <td className="px-4 py-3">{formatDate(activity.date)}</td>
                  <td className="px-4 py-3">{formatTime(activity.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTable;
