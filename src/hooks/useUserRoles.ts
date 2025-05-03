
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, UserRoleData } from "@/types/supabase";
import { UserProfile } from "@/types/users";
import { useAuth } from "@/context/AuthContext";

export const useUserRoles = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        // Use our new RPC function to get users with roles
        const { data, error } = await supabase
          .rpc('get_users_with_roles');

        if (error) {
          console.error("RPC function error:", error);
          throw error;
        }
        
        // If RPC fails, use a backup direct query approach
        if (!data || data.length === 0) {
          console.log("Falling back to direct query approach...");
          
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
          
          // Return transformed data
          return (profilesData || []).map((profile): UserProfile => {
            const userRole = userRolesData?.find(role => role.user_id === profile.id) || { role: 'parent' };
            
            return {
              id: profile.id,
              email: '',  // We don't have access to auth.users email from here
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              role: userRole.role as AppRole || 'parent',
              roleData: {
                role: userRole.role as AppRole || 'parent',
                // Fix: Check if the property exists before accessing it
                is_super_admin: typeof userRole === 'object' && 'is_super_admin' in userRole ? Boolean(userRole.is_super_admin) : false
              },
              phone: profile.phone || '',
              createdAt: '',  // We don't have access to this directly
              isActive: true, // Default value
              children: 0,    // Would need another query to get this
            };
          });
        }
        
        // Map the RPC function result to our expected format
        return data.map((item: any): UserProfile => {
          // Ensure we handle the type safely with proper default values
          const role = (item.role as AppRole) || 'parent';
          
          return {
            id: item.id,
            email: item.email || '',
            firstName: item.first_name || '',
            lastName: item.last_name || '',
            role: role,
            roleData: {
              role: role,
              // Fix: Check if the property exists before accessing it
              is_super_admin: typeof item === 'object' && 'is_super_admin' in item ? Boolean(item.is_super_admin) : false
            },
            phone: item.phone || '',
            createdAt: item.created_at || '',
            isActive: Boolean(item.is_active),
            children: 0,     // This would need a separate query
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
