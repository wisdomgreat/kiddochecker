import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Shift {
  id: string;
  staff_id: string;
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
}

export const useShifts = (dateRange?: { from: Date; to: Date }) => {
  const queryClient = useQueryClient();

  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ['shifts', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('shifts')
        .select(`
          *,
          profiles:staff_id (first_name, last_name, avatar_url),
          classes:class_id (name)
        `)
        .order('start_time', { ascending: true });

      if (dateRange) {
        query = query
          .gte('start_time', dateRange.from.toISOString())
          .lte('start_time', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Shift[];
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
