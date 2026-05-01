
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { AppRole } from "@/types/supabase";

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  is_super_admin: boolean;
  is_active: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: AppRole;
}

export interface UpdateUserData {
  userId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: AppRole;
    isActive?: boolean;
  };
}

export const useAdminUserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: { action: 'get_users' }
        });

        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch users');
        }

        return data.users || [];
      } catch (error: any) {
        console.error('Error in useAdminUserManagement query:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'create_user',
          ...userData
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updateData: UpdateUserData) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'update_user',
          ...updateData
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'delete_user',
          userId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const resendWelcomeEmailMutation = useMutation({
    mutationFn: async (user: AdminUser) => {
      // 1. Reset password and get new temp password
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'resend_welcome_email',
          userId: user.id,
          email: user.email,
          firstName: user.first_name
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // 2. Send the email via send-email function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          templateName: 'staff_onboarding',
          templateData: {
            firstName: user.first_name,
            email: user.email,
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
      toast({
        title: "Success",
        description: "Welcome email resent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error resending welcome email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend welcome email",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    resendWelcomeEmail: resendWelcomeEmailMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isResending: resendWelcomeEmailMutation.isPending,
  };
};

