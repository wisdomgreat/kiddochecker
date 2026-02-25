
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
      console.log("Fetching staff members...");

      try {
        const { data, error } = await supabase.rpc('get_staff_members');

        if (error) {
          console.error("Error fetching staff:", error);
          throw error;
        }

        console.log("Staff data received:", data);
        return (data || []) as StaffMember[];
      } catch (error: any) {
        console.error("Error in staffQuery:", error);
        return [] as StaffMember[];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
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
      console.log("Creating staff member via edge function:", staffData);

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create_user',
          email: staffData.email,
          password: 'TempPass123!', // You might want to generate this or allow input
          firstName: staffData.first_name,
          lastName: staffData.last_name,
          phone: staffData.phone,
          role: staffData.role
        }
      });

      if (error) {
        console.error("Error invoking edge function:", error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to create staff member");
      }

      // If volunteer status is needed, it might need a separate update or edge function support
      if (staffData.is_volunteer) {
        await supabase
          .from('user_roles')
          .update({ is_volunteer: true })
          .eq('user_id', data.user.id);
      }

      return data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error adding staff:", error);
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
      console.log("Updating staff member via edge function:", userId, updates);

      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'update_user',
          userId: userId,
          updates: {
            firstName: updates.first_name,
            lastName: updates.last_name,
            phone: updates.phone,
            role: updates.role
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Handle is_volunteer separately if not supported by edge function
      if (updates.is_volunteer !== undefined) {
        await supabase
          .from('user_roles')
          .update({ is_volunteer: updates.is_volunteer })
          .eq('user_id', userId);
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
      console.error("Error updating staff:", error);
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
