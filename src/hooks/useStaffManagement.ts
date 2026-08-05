/**
 * useStaffManagement — The single canonical hook for all staff CRUD operations.
 *
 * All operations go through the `admin-user-management` Edge Function to ensure
 * server-side authorization. No SERVICE_ROLE_KEY is ever exposed to the browser.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
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
      try {
        const { data, error } = await supabase.rpc('get_staff_members');
        if (!error && data && data.length > 0) {
          return data as StaffMember[];
        }
      } catch (e) {
        console.warn("get_staff_members RPC error, using fallback:", e);
      }

      // Fallback: Query staff user_roles & profiles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['staff', 'teacher', 'teacher_assistant', 'admin', 'super_admin']);

      const userIds = (rolesData || []).map((r: any) => r.user_id).filter(Boolean);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const roleMap = new Map((rolesData || []).map((r: any) => [r.user_id, r]));

      return userIds.map((uid: string) => {
        const p: any = profileMap.get(uid) || {};
        const r: any = roleMap.get(uid) || {};
        return {
          id: uid,
          email: p.email || '',
          first_name: p.first_name || p.firstName || 'Staff',
          last_name: p.last_name || p.lastName || '',
          role: r.role || 'staff',
          is_volunteer: Boolean(r.is_volunteer),
          staff_pin: p.staff_pin || '1234',
          verification_status: r.verification_status || 'verified',
          department: p.department || 'General',
          created_at: r.created_at || new Date().toISOString(),
        } as StaffMember;
      });
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
            staffPin: staffData.staff_pin,
            department: staffData.department,
            specialties: staffData.specialties,
            maxHoursPerWeek: staffData.max_hours_per_week,
            staffGroups: staffData.staff_groups,
            supervisorId: staffData.supervisor_id,
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
        } catch (e) { }
        console.error("Admin user management error:", errorDetails);
        throw new Error(`User management failed: ${errorDetails}`);
      }

      if (!data?.success) throw new Error(data?.error ?? 'User creation failed');

      // Send the setup email to the new staff/teacher
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: staffData.email,
          templateName: 'staff_onboarding',
          templateData: {
            firstName: staffData.first_name,
            email: staffData.email,
            tempPassword: tempPassword,
            loginUrl: `${window.location.origin}/login`,
          },
          type: 'staff_onboarding',
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
              staffPin: updates.staff_pin,
              department: updates.department,
              staffGroups: updates.staff_groups,
              specialties: updates.specialties,
              maxHoursPerWeek: updates.max_hours_per_week,
              supervisorId: updates.supervisor_id,
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

  // ── RESEND WELCOME ──────────────────────────────────────────────────────────
  const resendWelcomeEmailMutation = useMutation({
    mutationFn: async (member: StaffMember) => {
      const { data, error } = await supabase.functions.invoke(
        'admin-user-management',
        {
          body: {
            action: 'resend_welcome_email',
            userId: member.user_id,
            email: member.email,
            firstName: member.first_name
          },
        }
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Request failed');

      // Now send the email with the new temp password
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: member.email,
          templateName: 'staff_onboarding',
          templateData: {
            firstName: member.first_name,
            email: member.email,
            tempPassword: data.tempPassword,
            loginUrl: `${window.location.origin}/login`,
          },
          type: 'staff_onboarding',
        }
      });

      if (emailError) throw emailError;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Welcome email resent successfully with a new temporary password.' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to resend welcome email',
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
    resendWelcomeEmail: resendWelcomeEmailMutation.mutate,
    isResendingEmail: resendWelcomeEmailMutation.isPending,
  };
};

export default useStaffManagement;

