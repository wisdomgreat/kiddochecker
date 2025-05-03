
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
        
        // Direct query approach - avoiding RPC function that has type mismatches
        console.log("Fetching users with direct query approach...");
        
        // Get all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
          
        // Get all user roles
        const { data: userRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesError) throw rolesError;
        
        // Get email addresses from auth users (for admins only)
        // Use a direct SQL query instead of RPC to avoid type issues
        const { data: emailsData, error: emailsError } = await supabase
          .from('auth_users_emails_view')
          .select('id, email');
          
        if (emailsError) {
          console.error("Error fetching emails:", emailsError);
        }
        
        // Create a map of user IDs to emails
        const emailsMap = {};
        if (emailsData && Array.isArray(emailsData)) {
          emailsData.forEach(item => {
            if (item && item.id && item.email) {
              emailsMap[item.id] = item.email;
            }
          });
        }
        
        // Return transformed data
        return (profilesData || []).map((profile): UserProfile => {
          const userRole = userRolesData?.find(role => role.user_id === profile.id) || { role: 'parent' };
          
          return {
            id: profile.id,
            email: emailsMap[profile.id] || '',
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            role: userRole.role as AppRole || 'parent',
            roleData: {
              role: userRole.role as AppRole || 'parent',
              is_super_admin: typeof userRole === 'object' && 'is_super_admin' in userRole ? Boolean(userRole.is_super_admin) : false
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
