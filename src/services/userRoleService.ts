
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/supabase";

export class UserRoleService {
  static async getCurrentUserRole(): Promise<AppRole | null> {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error) {
        console.error("Error getting current user role:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Exception getting current user role:", error);
      return null;
    }
  }

  static async assignRole(userId: string, role: AppRole, isSuperAdmin: boolean = false): Promise<boolean> {
    try {
      // First try to update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ 
          role, 
          is_super_admin: isSuperAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        // If update fails, try to insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role,
            is_super_admin: isSuperAdmin
          });

        if (insertError) {
          console.error("Error inserting user role:", insertError);
          return false;
        }
      }
      
      console.log(`Successfully assigned role ${role} to user ${userId}`);
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
      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "User creation failed" };
      }

      // Assign the role
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
          role: null,
          isSuperAdmin: false,
          canAccessAdmin: false,
          canAccessParent: false
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
        role: null,
        isSuperAdmin: false,
        canAccessAdmin: false,
        canAccessParent: false
      };
    }
  }
}
