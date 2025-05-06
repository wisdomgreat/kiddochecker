
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, RefreshCcw, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  location?: string;
}

const UpcomingEventsList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_upcoming_events', { limit_count: 5 });
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error: any) {
        console.error("Error fetching upcoming events:", error);
        toast({
          title: "Error",
          description: "Could not load upcoming events",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [toast]);
  
  const formatEventDate = (start: string, end?: string) => {
    try {
      const startDate = new Date(start);
      
      if (!end) {
        return format(startDate, "MMM d, yyyy • h:mm a");
      }
      
      const endDate = new Date(end);
      
      // If same day
      if (startDate.toDateString() === endDate.toDateString()) {
        return `${format(startDate, "MMM d, yyyy")} • ${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
      }
      
      // Different days
      return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
    } catch (e) {
      return "Date not available";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Upcoming Events</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/events-management')}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCcw className="h-5 w-5 animate-spin text-purple-600 mr-2" />
            <span className="text-sm">Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
            <p className="mt-1 text-xs text-gray-500">Create an event to get started</p>
            <div className="mt-4">
              <Button size="sm" onClick={() => navigate('/events-management')}>
                <CalendarPlus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                <div className="flex items-center text-xs text-gray-600 mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatEventDate(event.start_date, event.end_date)}
                </div>
                {event.location && (
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsList;
