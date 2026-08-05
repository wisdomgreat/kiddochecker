import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Shift {
  id: string;
  staff_id?: string;
  event_id?: string;
  volunteer_role_id?: string;
  ministry_id?: string;
  class_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'absent';
  role_type: 'leader' | 'assistant' | 'volunteer' | 'admin';
  notes?: string;
  required_group_id?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  classes?: {
    name: string;
  };
  volunteer_roles?: {
    name: string;
  };
}

export const useShifts = (filters?: { from?: Date; to?: Date; event_id?: string }) => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading, error } = useQuery({
    queryKey: ['shifts', filters],
    queryFn: async () => {
      let query = supabase
        .from('shifts')
        .select('*')
        .order('start_time', { ascending: true });

      if (filters?.from) {
        query = query.gte('start_time', filters.from.toISOString());
      }
      if (filters?.to) {
        query = query.lte('start_time', filters.to.toISOString());
      }
      if (filters?.event_id) {
        query = query.eq('event_id', filters.event_id);
      }

      const { data: shiftRows, error: shiftErr } = await query;
      if (shiftErr) {
        console.error("Shifts query error:", shiftErr);
      }

      // Fetch profiles & classes map for client enrichment
      const [{ data: profiles }, { data: classes }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, avatar_url'),
        supabase.from('classes').select('id, name')
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const classMap = new Map((classes || []).map((c: any) => [c.id, c]));

      const rawShifts = shiftRows || [];
      const enrichedShifts: Shift[] = rawShifts.map((s: any) => ({
        ...s,
        profiles: s.staff_id ? profileMap.get(s.staff_id) : undefined,
        classes: s.class_id ? classMap.get(s.class_id) : undefined,
      }));

      return enrichedShifts;
    },
  });

  const createShift = useMutation({
    mutationFn: async (newShift: Omit<Shift, 'id' | 'profiles' | 'classes'>) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert([newShift])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shift> & { id: string }) => {
      const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  return {
    shifts,
    isLoading,
    error,
    createShift,
    updateShift,
    deleteShift,
  };
};

