
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

/**
 * Check if a user has a specific permission
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @returns Promise<boolean> - Whether the user has permission
 */
export const hasPermission = async (resource: string, action: string): Promise<boolean> => {
  try {
    // First check if the user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if the user is an admin (admins have all permissions)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('is_super_admin, role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (roleData?.is_super_admin || roleData?.role === 'super_admin' || roleData?.role === 'admin') {
      return true;
    }
    
    // Check for specific permission through the permissions table
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions:permission_id (
          resource,
          action
        )
      `)
      .eq('permissions.resource', resource)
      .eq('permissions.action', action);
    
    if (error) {
      console.error("Error checking permission:", error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error("Error in hasPermission:", error);
    return false;
  }
};

/**
 * Get user role and determine if they have admin access
 */
export const getUserRoleInfo = async (): Promise<{
  role: AppRole | null;
  isAdmin: boolean;
}> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { role: null, isAdmin: false };
    }
    
    // Get the user's role
    const { data } = await supabase
      .from('user_roles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (!data) {
      return { role: null, isAdmin: false };
    }
    
    return {
      role: data.role,
      isAdmin: data.role === 'admin' || data.role === 'super_admin' || !!data.is_super_admin
    };
  } catch (error) {
    console.error("Error getting user role info:", error);
    return { role: null, isAdmin: false };
  }
};

/**
 * Helper function to check if a user has admin access
 */
export const isAdmin = async (): Promise<boolean> => {
  const { isAdmin } = await getUserRoleInfo();
  return isAdmin;
};
