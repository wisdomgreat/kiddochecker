
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useCalendarEvents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async (): Promise<CalendarEvent[]> => {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) {
          console.error("Error fetching calendar events:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useCalendarEvents:", error);
        return [];
      }
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent: createEventMutation.mutate,
    isCreating: createEventMutation.isPending,
  };
};
