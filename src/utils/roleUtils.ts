
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

export const assignUserRole = async (userId: string, role: AppRole, isSuperAdmin: boolean = false) => {
  console.log(`Assigning role ${role} to user ${userId}, super_admin: ${isSuperAdmin}`);
  
  try {
    // First try to insert a new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        is_super_admin: isSuperAdmin,
      });

    if (insertError) {
      console.log("Insert failed, trying update:", insertError.message);
      
      // If insert fails, try to update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({
          role: role,
          is_super_admin: isSuperAdmin,
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }
      
      console.log(`Successfully updated user ${userId} to role ${role}`);
    } else {
      console.log(`Successfully assigned role ${role} to user ${userId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error assigning role:", error);
    return { success: false, error };
  }
};

export const getCurrentUserRole = async () => {
  try {
    // Use the safe RPC function
    const { data, error } = await supabase.rpc('get_current_user_role');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting current user role:", error);
    return null;
  }
};

export const verifyAdminRole = async (userId: string) => {
  try {
    // Use the safe admin check function
    const { data, error } = await supabase.rpc('is_admin_user_safe');
    
    if (error) {
      console.error("Error verifying admin role:", error);
      return false;
    }
    
    console.log(`User ${userId} admin verification:`, data);
    return data || false;
  } catch (error) {
    console.error("Error verifying admin role:", error);
    return false;
  }
};

