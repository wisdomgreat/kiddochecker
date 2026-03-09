/**
 * useStaffManagement — The single canonical hook for all staff CRUD operations.
 *
 * All operations go through the `admin-user-management` Edge Function to ensure
 * server-side authorization. No SERVICE_ROLE_KEY is ever exposed to the browser.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/queryKeys';
import type { StaffMember, AddStaffData, UpdateStaffData } from '@/types/staff';

export type { StaffMember, AddStaffData, UpdateStaffData };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a cryptographically secure temporary password. */
const generateSecurePassword = (): string => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useStaffManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── LIST ────────────────────────────────────────────────────────────────────
  const {
    data: staffMembers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.STAFF,
    queryFn: async (): Promise<StaffMember[]> => {
      const { data, error } = await supabase.rpc('get_staff_members');
      if (error) throw error;
      return (data ?? []) as StaffMember[];
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 30_000,
    gcTime: 60_000,
  });

  // ── ADD ─────────────────────────────────────────────────────────────────────
  const addStaffMutation = useMutation({
    mutationFn: async (staffData: AddStaffData) => {
      const tempPassword = generateSecurePassword();

      const { data, error } = await supabase.functions.invoke(
        'admin-user-management',
        {
          body: {
            action: 'create_user',
            email: staffData.email,
            password: tempPassword,
            firstName: staffData.first_name,
            lastName: staffData.last_name,
            phone: staffData.phone ?? null,
            role: staffData.role,
            isVolunteer: staffData.is_volunteer ?? false,
          },
        }
      );

      if (error) {
        let errorDetails = error.message;
        try {
            if (error.context && typeof error.context.text === 'function') {
                const text = await error.context.text();
                const json = JSON.parse(text);
                if (json.error) errorDetails = json.error;
            } else if (error.context) {
                if (error.context.error) errorDetails = error.context.error;
            }
        } catch (e) {}
        console.error("Admin user management error:", errorDetails);
        throw new Error(`User management failed: ${errorDetails}`);
      }
      
      if (!data?.success) throw new Error(data?.error ?? 'User creation failed');

      // Send the setup email to the new staff/teacher
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: staffData.email,
          subject: "KiddoChecker - Staff Account Created!",
          message: `Hello ${staffData.first_name},<br/><br/>An admin has created your staff account on KiddoChecker.<br/><br/>Your temporary login details are:<br/><strong>Email:</strong> ${staffData.email}<br/><strong>Password:</strong> ${tempPassword}<br/><br/>Please log in and proceed with your onboarding setup. You will be prompted to change your password immediately.`,
          type: 'general',
        }
      });
      
      if (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't throw the error, we already created the user! The admin can manually send them the password or we can just toast a warning.
          toast({ title: 'Staff added, but failed to send email. Check Supabase logs.', variant: 'destructive' });
      }

      return { user: data.user, tempPassword };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS });
      toast({ title: 'Staff member added successfully. Email sent!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add staff member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  const updateStaffMutation = useMutation({
    mutationFn: async ({ userId, updates }: UpdateStaffData) => {
      const { data, error } = await supabase.functions.invoke(
        'admin-user-management',
        {
          body: {
            action: 'update_user',
            userId,
            updates: {
              firstName: updates.first_name,
              lastName: updates.last_name,
              phone: updates.phone,
              role: updates.role,
              isActive: updates.is_active,
              isVolunteer: updates.is_volunteer,
            },
          },
        }
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'User update failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS });
      toast({ title: 'Staff member updated successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update staff member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke(
        'admin-user-management',
        {
          body: { action: 'delete_user', userId },
        }
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'User deletion failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STAFF });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_USERS });
      toast({ title: 'Staff member removed successfully' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove staff member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    staffMembers,
    isLoading,
    error,
    refetch,
    // keeping "staff" alias for backward compat with useStaff consumers
    staff: staffMembers,
    addStaff: addStaffMutation.mutate,
    addStaffAsync: addStaffMutation.mutateAsync,
    isAddingStaff: addStaffMutation.isPending,
    updateStaff: updateStaffMutation.mutate,
    updateStaffAsync: updateStaffMutation.mutateAsync,
    isUpdatingStaff: updateStaffMutation.isPending,
    deleteStaff: deleteStaffMutation.mutate,
    isDeletingStaff: deleteStaffMutation.isPending,
  };
};

export default useStaffManagement;
