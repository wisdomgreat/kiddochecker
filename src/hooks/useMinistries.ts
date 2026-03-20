import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Ministry {
  id: string;
  name: string;
  description?: string;
  head_staff_id?: string;
  head_staff?: { first_name: string; last_name: string };
  groups?: MinistryGroup[];
}

export interface MinistryGroup {
  id: string;
  ministry_id: string;
  name: string;
  meeting_day?: string;
  meeting_time?: string;
  location?: string;
  leader_profile_id?: string;
  leader?: { first_name: string; last_name: string };
  member_count?: number;
}

export const useMinistries = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ministriesQuery = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          head_staff:profiles!head_staff_id (first_name, last_name),
          groups:ministry_groups (
            *,
            leader:profiles!leader_profile_id (first_name, last_name),
            member_count:ministry_member_assignments(count)
          )
        `)
        .order('name');

      if (error) throw error;
      
      // Transform member_count from [{count: n}] to n
      const transformed = (data as any[]).map(m => ({
        ...m,
        groups: m.groups?.map((g: any) => ({
          ...g,
          member_count: g.member_count?.[0]?.count || 0
        }))
      }));
      
      return transformed as Ministry[];
    },
  });

  const createMinistry = useMutation({
    mutationFn: async (vars: Partial<Ministry>) => {
      const { data, error } = await supabase.from('ministries').insert(vars).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({ title: 'Ministry Created', description: 'New department added to the church.' });
    },
  });

  const createGroup = useMutation({
    mutationFn: async (vars: Partial<MinistryGroup>) => {
      const { data, error } = await supabase.from('ministry_groups').insert(vars).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({ title: 'Group Created', description: 'Small group successfully established.' });
    },
  });

  const assignMember = useMutation({
    mutationFn: async ({ membershipId, groupId, role }: { membershipId: string; groupId: string; role: string }) => {
      const { data, error } = await supabase
        .from('ministry_member_assignments')
        .insert({ membership_id: membershipId, group_id: groupId, role })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({ title: 'Member Assigned', description: 'Assignment complete.' });
    },
  });

  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('ministry_member_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['group-members'] });
      toast({ title: 'Member Removed', description: 'Assignment revoked successfully.' });
    },
  });

  const updateMinistry = useMutation({
    mutationFn: async ({ id, ...vars }: Partial<Ministry> & { id: string }) => {
      const { data, error } = await supabase.from('ministries').update(vars).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({ title: 'Ministry Updated', description: 'Changes saved successfully.' });
    },
  });

  const deleteMinistry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ministries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({ title: 'Ministry Deleted', description: 'Department removed.' });
    },
  });

  return {
    ministries: ministriesQuery.data || [],
    isLoading: ministriesQuery.isLoading,
    createMinistry: createMinistry.mutate,
    createGroup: createGroup.mutate,
    assignMember: assignMember.mutate,
    removeAssignment: removeAssignment.mutate,
    isCreatingMinistry: createMinistry.isPending,
    isCreatingGroup: createGroup.isPending,
    updateMinistry: updateMinistry.mutate,
    deleteMinistry: deleteMinistry.mutate,
  };
};

export const useGroupMembers = (groupId?: string) => {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from('ministry_member_assignments')
        .select(`
          *,
          membership:church_memberships (
            *,
            profiles:profiles!profile_id (first_name, last_name, email),
            children:children!child_id (first_name, last_name)
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
};
