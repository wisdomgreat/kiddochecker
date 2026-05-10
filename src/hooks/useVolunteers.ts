import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

export interface VolunteerRole {
  id: string;
  ministry_id: string;
  name: string;
  description?: string;
  skills_required?: string[];
}

export interface VolunteerEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  stats?: {
    total_positions: number;
    filled_positions: number;
    open_positions: number;
    confirmed_count: number;
  };
}

export const useVolunteers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ['church-events-volunteers'],
    queryFn: async () => {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })
        .gte('start_date', new Date().toISOString());

      if (eventsError) throw eventsError;

      const eventsWithStats = await Promise.all((events || []).map(async (event) => {
        const { data: stats, error: statsError } = await supabase.rpc('get_event_volunteer_stats', { p_event_id: event.id });
        if (statsError) return { ...event, stats: { total_positions: 0, filled_positions: 0, open_positions: 0, confirmed_count: 0 } };
        return { ...event, stats };
      }));

      return eventsWithStats as VolunteerEvent[];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['volunteer-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('volunteer_roles').select('*').order('name');
      if (error) throw error;
      return data as VolunteerRole[];
    },
  });

  const createRole = useMutation({
    mutationFn: async (vars: Partial<VolunteerRole>) => {
      const { data, error } = await supabase.from('volunteer_roles').insert(vars).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-roles'] });
      toast({ title: 'Role Created', description: 'New volunteer role established.' });
    },
  });

  const createPosition = useMutation({
    mutationFn: async ({ eventId, roleId, ministryId, startTime, endTime }: any) => {
      const { data, error } = await supabase.from('shifts').insert({
        event_id: eventId,
        volunteer_role_id: roleId,
        ministry_id: ministryId,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
        role_type: 'volunteer'
      }).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-events-volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast({ title: 'Position Opened', description: 'New volunteer slot added to the event.' });
    },
  });

  return {
    events: eventsQuery.data || [],
    roles: rolesQuery.data || [],
    isEventsLoading: eventsQuery.isLoading,
    isRolesLoading: rolesQuery.isLoading,
    createRole: createRole.mutate,
    createPosition: createPosition.mutate,
  };
};

