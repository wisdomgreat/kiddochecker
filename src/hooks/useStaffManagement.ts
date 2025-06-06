
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

export const useStaffManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["staff-management"],
    queryFn: async () => {
      console.log("Fetching staff members...");
      
      const { data, error } = await supabase.rpc('get_staff_members');
      
      if (error) {
        console.error("Error fetching staff:", error);
        throw error;
      }
      
      console.log("Staff data received:", data);
      return (data || []) as StaffMember[];
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
      console.log("Creating staff member:", staffData);
      
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: staffData.email,
        password: 'TempPass123!',
        options: {
          data: {
            first_name: staffData.first_name,
            last_name: staffData.last_name,
            phone: staffData.phone,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!userData.user) throw new Error("Failed to create user account");

      const validRoles: AppRole[] = ['admin', 'staff', 'parent', 'super_admin', 'teacher', 'teacher_assistant'];
      const roleToUse: AppRole = validRoles.includes(staffData.role as AppRole) ? staffData.role as AppRole : 'staff';
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ 
          role: roleToUse,
          is_volunteer: staffData.is_volunteer || false
        })
        .eq('user_id', userData.user.id);

      if (roleError) throw roleError;
      return userData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-management"] });
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

  return {
    staff: staffQuery.data || [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    addStaff: addStaffMutation.mutate,
    isAddingStaff: addStaffMutation.isPending,
  };
};
