
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/supabase';

export interface StaffMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_super_admin: boolean;
  is_volunteer: boolean;
  is_active: boolean;
}

export interface AddStaffData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_volunteer: boolean;
}

export const useStaffManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffMembers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async (): Promise<StaffMember[]> => {
      const { data, error } = await supabase.rpc('get_staff_members');
      
      if (error) {
        console.error('Error fetching staff members:', error);
        throw error;
      }
      
      // Type the data properly with AppRole
      return (data || []).map(member => ({
        ...member,
        role: member.role as AppRole
      }));
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: AddStaffData) => {
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12);
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: staffData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          phone: staffData.phone,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: staffData.role,
          is_volunteer: staffData.is_volunteer,
        });

      if (roleError) throw roleError;

      return { user: authData.user, tempPassword };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member',
        variant: 'destructive',
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<StaffMember> }) => {
      // Update profile if needed
      if (updates.first_name || updates.last_name || updates.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: updates.first_name,
            last_name: updates.last_name,
            phone: updates.phone,
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update role if needed
      if (updates.role || updates.is_volunteer !== undefined) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: updates.role,
            is_volunteer: updates.is_volunteer,
          })
          .eq('user_id', userId);

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error updating staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member',
        variant: 'destructive',
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({
        title: 'Success',
        description: 'Staff member removed successfully',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove staff member',
        variant: 'destructive',
      });
    },
  });

  return {
    staffMembers,
    isLoading,
    error,
    refetch,
    addStaff: addStaffMutation.mutate,
    isAddingStaff: addStaffMutation.isPending,
    updateStaff: updateStaffMutation.mutate,
    isUpdatingStaff: updateStaffMutation.isPending,
    deleteStaff: deleteStaffMutation.mutate,
    isDeletingStaff: deleteStaffMutation.isPending,
  };
};
