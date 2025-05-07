
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, UserRoleData } from "@/types/supabase";
import { UserProfile, formatUserData } from "@/types/users";
import { useAuth } from "@/context/AuthContext";

export const useUserRoles = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        // Get all profiles directly - avoid using the problematic RPC function
        console.log("Fetching user profiles directly...");
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Get email addresses
        const { data: emailsData, error: emailsError } = await supabase
          .from('auth_users_with_emails')
          .select('id, email');
          
        if (emailsError) throw emailsError;
        
        // Create email lookup map
        const emailsMap: Record<string, string> = {};
        if (emailsData) {
          emailsData.forEach((item: any) => {
            if (item && item.id && item.email) {
              emailsMap[item.id] = item.email;
            }
          });
        }
        
        // Direct query for user roles to avoid recursion issues
        const { data: userRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesError) throw rolesError;
        
        // Create roles lookup map
        const rolesMap: Record<string, any> = {};
        if (userRolesData) {
          userRolesData.forEach((role: any) => {
            if (role && role.user_id) {
              rolesMap[role.user_id] = {
                role: role.role,
                is_super_admin: role.is_super_admin
              };
            }
          });
        }
        
        // Combine data
        return (profilesData || []).map((profile): UserProfile => {
          const roleData = rolesMap[profile.id] || { role: 'parent', is_super_admin: false };
          
          return {
            id: profile.id,
            email: emailsMap[profile.id] || '',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            role: roleData.role as AppRole || 'parent',
            roleData: {
              role: roleData.role as AppRole || 'parent',
              is_super_admin: !!roleData.is_super_admin
            },
            phone: profile.phone || '',
            createdAt: profile.created_at || '',
            isActive: true, // Default value
            children: 0,    // Would need another query to get this
          };
        });
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: `Failed to load users: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });
};

export default useUserRoles;
