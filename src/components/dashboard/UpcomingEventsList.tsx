
import { useState, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export interface EventItem {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

interface UpcomingEventsListProps {
  limit?: number;
}

const UpcomingEventsList = ({ limit = 3 }: UpcomingEventsListProps) => {
  const navigate = useNavigate();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const today = new Date().toISOString();
      
      try {
        // Check if the functions exist
        const { data: functionsExist, error: funcError } = await supabase
          .rpc('get_upcoming_events', { limit_count: limit })
          .select();
        
        if (funcError) {
          console.log("Using direct query as RPC function is not available:", funcError);
          
          // Fallback to direct query if the function doesn't exist
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('start_date', today)
            .order('start_date', { ascending: true })
            .limit(limit);
          
          if (error) {
            console.error("Error fetching events:", error);
            return [];
          }
          
          return (data || []).map(event => ({
            id: event.id,
            title: event.title,
            startDate: event.start_date,
            endDate: event.end_date,
            location: event.location
          }));
        } else {
          // Use the RPC function if it exists
          return (functionsExist || []).map(event => ({
            id: event.id,
            title: event.title,
            startDate: event.start_date,
            endDate: event.end_date,
            location: event.location
          }));
        }
      } catch (error) {
        console.error("Error in event query:", error);
        return [];
      }
    }
  });

  const handleViewAllEvents = () => {
    navigate('/events-management');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2"></div>
          <span className="text-gray-600">Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Calendar size={32} className="text-gray-400 mb-2" />
            <p className="text-gray-700 font-medium">No upcoming events</p>
            <p className="text-gray-500 text-sm mt-1">Check back later for new events</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id} className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800">{event.title}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    <span>
                      {format(new Date(event.startDate), "MMM dd, yyyy")}
                      {event.endDate && ` - ${format(new Date(event.endDate), "MMM dd, yyyy")}`}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            onClick={handleViewAllEvents} 
            variant="outline" 
            className="w-full"
          >
            View All Events
          </Button>
        </div>
      )}
    </div>
  );
};

export default UpcomingEventsList;
