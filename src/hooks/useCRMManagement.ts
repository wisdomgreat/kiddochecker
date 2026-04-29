
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EngagementTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'backlog';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  member_id: string;
  assigned_to?: string;
  due_date?: string;
  member?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface Donation {
  id: string;
  member_id: string;
  amount: number;
  currency: string;
  donation_date: string;
  category: string;
  payment_method: string;
  is_anonymous: boolean;
  notes?: string;
  member?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export const useCRMManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Kanban Tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['engagement-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_tasks')
        .select(`
          *,
          member:church_memberships (
            profiles:profiles (first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EngagementTask[];
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('engagement_tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-tasks'] });
      toast({ title: 'Task Updated', description: 'Kanban status synchronized.' });
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: async ({ id, assigned_to }: { id: string; assigned_to: string }) => {
      const { data, error } = await supabase
        .from('engagement_tasks')
        .update({ assigned_to })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-tasks'] });
      toast({ title: 'Task Assigned', description: 'Follow-up team notified.' });
    },
  });

  // 2. Journey Progress tracking
  const { data: journeys = [], isLoading: journeysLoading } = useQuery({
    queryKey: ['journey-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journey_progress')
        .select(`
          *,
          membership:church_memberships (
            profiles:profiles (first_name, last_name, email)
          )
        `)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });

  // 3. Donations / Giving
  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['donations-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          member:church_memberships (
            profiles:profiles (first_name, last_name)
          )
        `)
        .order('donation_date', { ascending: false });
      if (error) throw error;
      return data as Donation[];
    },
  });

  const addDonationMutation = useMutation({
    mutationFn: async (donation: Partial<Donation>) => {
      const { data, error } = await supabase
        .from('donations')
        .insert([donation])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations-history'] });
      toast({ title: 'Contribution Logged', description: 'Giving statement updated.' });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const { data, error } = await supabase
        .from('engagement_tasks')
        .insert([task])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-tasks'] });
      toast({ title: 'Task Created', description: 'Outreach item added to board.' });
    },
  });

  return {
    tasks,
    tasksLoading,
    updateTaskStatus: updateTaskStatusMutation.mutate,
    assignTask: assignTaskMutation.mutate,
    addTask: addTaskMutation.mutate,
    journeys,
    journeysLoading,
    donations,
    donationsLoading,
    addDonation: addDonationMutation.mutate,
  };
};

