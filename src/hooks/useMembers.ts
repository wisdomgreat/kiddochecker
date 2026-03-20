import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MembershipType = 'registered' | 'regular' | 'visitor';
export type MembershipStatus = 'active' | 'inactive' | 'deceased' | 'transferred';

export interface ChurchMember {
  id: string;
  profile_id?: string;
  child_id?: string;
  membership_type: MembershipType;
  status: MembershipStatus;
  joined_at: string;
  baptism_date?: string;
  confirmation_date?: string;
  wedding_date?: string;
  pastoral_notes?: string;
  spiritual_milestones: unknown[];
  profiles?: { id: string; first_name: string; last_name: string; email: string; phone?: string };
  children?: { first_name: string; last_name: string };
}

export interface ChurchStats {
  total_members: number;
  registered_count: number;
  active_groups: number;
  attendance_this_week: number;
}

export const useMembers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['church-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('church_memberships')
        .select(`
          *,
          profiles (id, first_name, last_name, email, phone),
          children (first_name, last_name)
        `)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data as ChurchMember[];
    },
  });

  const churchStatsQuery = useQuery({
    queryKey: ['church-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_church_stats');
      if (error) throw error;
      return data as ChurchStats;
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (vars: Partial<ChurchMember> & { id: string }) => {
      const { id, ...rest } = vars;
      const { data, error } = await supabase
        .from('church_memberships')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-members'] });
      queryClient.invalidateQueries({ queryKey: ['church-stats'] });
      toast({ title: 'Profile Updated', description: 'Membership details saved.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (vars: Partial<ChurchMember>) => {
      const { data, error } = await supabase
        .from('church_memberships')
        .insert(vars)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['church-members'] });
        queryClient.invalidateQueries({ queryKey: ['church-stats'] });
        toast({ title: 'Member Added', description: 'New church membership record created.' });
    },
    onError: (err: Error) => {
        toast({ title: 'Create Failed', description: err.message, variant: 'destructive' });
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    stats: churchStatsQuery.data,
    updateMember: updateMemberMutation.mutate,
    createMember: createMemberMutation.mutate,
    isUpdating: updateMemberMutation.isPending,
    isCreating: createMemberMutation.isPending,
  };
};
