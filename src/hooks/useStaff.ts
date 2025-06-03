
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/types/supabase";

export interface StaffMember {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_super_admin: boolean;
  is_volunteer: boolean;
  is_active: boolean;
}

export const useStaff = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_staff_members');
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: {
      email: string;
      first_name: string;
      last_name: string;
      phone?: string;
      role: string;
      is_volunteer?: boolean;
    }) => {
      // This would typically involve inviting the user via email
      // For now, we'll create a placeholder implementation
      const { data, error } = await supabase.auth.admin.createUser({
        email: staffData.email,
        email_confirm: true,
        user_metadata: {
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          phone: staffData.phone,
        }
      });

      if (error) throw error;

      // Create user role
      if (data.user) {
        const validRoles: AppRole[] = ['admin', 'staff', 'parent', 'super_admin', 'teacher', 'teacher_assistant'];
        const roleToUse: AppRole = validRoles.includes(staffData.role as AppRole) ? staffData.role as AppRole : 'staff';
        
        const { error: roleError } = await supabase.rpc('create_user_role', {
          p_user_id: data.user.id,
          p_role: roleToUse,
          p_is_volunteer: staffData.is_volunteer || false,
        });
        
        if (roleError) throw roleError;
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ userId, updates }: { 
      userId: string; 
      updates: Partial<StaffMember> 
    }) => {
      // Update profile
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

      // Update role if changed
      if (updates.role) {
        const validRoles: AppRole[] = ['admin', 'staff', 'parent', 'super_admin', 'teacher', 'teacher_assistant'];
        const roleToUse: AppRole = validRoles.includes(updates.role as AppRole) ? updates.role as AppRole : 'staff';
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({
            role: roleToUse,
            is_volunteer: updates.is_volunteer,
          })
          .eq('user_id', userId);
        
        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  return {
    staff: staffQuery.data || [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    addStaff: addStaffMutation.mutate,
    updateStaff: updateStaffMutation.mutate,
    isAddingStaff: addStaffMutation.isPending,
    isUpdatingStaff: updateStaffMutation.isPending,
  };
};
