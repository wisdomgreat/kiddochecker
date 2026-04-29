
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

const UpcomingEventsList = () => {
  // Mock data - in a real app this would come from props or a hook
  const events = [
    {
      id: "1",
      title: "Children's Christmas Program",
      date: "2024-12-15",
      time: "10:00 AM",
    },
    {
      id: "2", 
      title: "Parent Volunteer Training",
      date: "2024-12-08",
      time: "2:00 PM",
    },
  ];

  if (events.length === 0) {
    return (
      <div className="text-center py-6">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No upcoming events</h3>
        <p className="mt-1 text-sm text-gray-500">
          Events will appear here when scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="p-3 border rounded-lg hover:bg-gray-50">
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{event.date}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{event.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingEventsList;

