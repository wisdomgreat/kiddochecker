
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

export class UserRoleService {
  static async getCurrentUserRole(): Promise<AppRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Use the safe RPC function first
      const { data, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        console.error("Error getting current user role:", error);
        // If RPC fails, try direct query as fallback
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, is_super_admin')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          // If no role found, assign default parent role
          if (roleError.code === 'PGRST116') {
            await this.assignRole(user.id, 'parent');
            return 'parent';
          }
          return 'parent';
        }

        return roleData?.is_super_admin ? 'super_admin' : (roleData?.role || 'parent');
      }

      return (data as AppRole) || 'parent';
    } catch (error) {
      console.error("Exception getting current user role:", error);
      return 'parent';
    }
  }

  static async assignRole(userId: string, role: AppRole, isSuperAdmin: boolean = false): Promise<boolean> {
    try {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          is_super_admin: isSuperAdmin,
        });

      if (insertError) {
        // If insert fails due to duplicate, try update
        if (insertError.code === '23505') {
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ 
              role, 
              is_super_admin: isSuperAdmin,
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error("Error updating user role:", updateError);
            return false;
          }
        } else {
          console.error("Error inserting user role:", insertError);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Exception assigning user role:", error);
      return false;
    }
  }

  static async createUserWithRole(
    email: string, 
    password: string, 
    role: AppRole, 
    userData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "User creation failed" };
      }

      // Assign role after successful signup
      const roleAssigned = await this.assignRole(data.user.id, role, role === 'super_admin');
      
      if (!roleAssigned) {
        return { success: false, error: "Role assignment failed" };
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("Exception creating user with role:", error);
      return { success: false, error: error.message };
    }
  }

  static async verifyUserPermissions(userId: string): Promise<{
    role: AppRole | null;
    isSuperAdmin: boolean;
    canAccessAdmin: boolean;
    canAccessParent: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_super_admin')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return {
          role: 'parent',
          isSuperAdmin: false,
          canAccessAdmin: false,
          canAccessParent: true
        };
      }

      const canAccessAdmin = data.role === 'admin' || data.role === 'super_admin' || data.is_super_admin;
      const canAccessParent = data.role === 'parent';

      return {
        role: data.role,
        isSuperAdmin: data.is_super_admin || false,
        canAccessAdmin,
        canAccessParent
      };
    } catch (error) {
      console.error("Exception verifying user permissions:", error);
      return {
        role: 'parent',
        isSuperAdmin: false,
        canAccessAdmin: false,
        canAccessParent: true
      };
    }
  }
}

