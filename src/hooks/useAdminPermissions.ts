
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminPermissions = () => {
  const { user, userRole } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["admin-permissions", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Check if user has admin permissions
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_super_admin')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching permissions:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
  });

  const isAdmin = permissions?.role === 'admin' || permissions?.role === 'super_admin' || permissions?.is_super_admin;
  const isSuperAdmin = permissions?.role === 'super_admin' || permissions?.is_super_admin;

  return {
    isAdmin,
    isSuperAdmin,
    canCreateUsers: isAdmin,
    canManageUsers: isAdmin,
    canViewAllUsers: isAdmin,
    canDeleteUsers: isSuperAdmin,
    canManageOrganization: isAdmin,
    canAccessAdminDashboard: isAdmin,
    isLoading
  };
};
