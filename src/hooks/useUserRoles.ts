
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/users";

const useUserRoles = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        console.log("Fetching users with roles...");
        
        // Use the safe RPC function
        const { data, error } = await supabase.rpc('get_users_with_roles');

        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }

        console.log("Raw user data:", data);

        if (!data || data.length === 0) {
          console.log("No users found");
          return [];
        }

        const formattedUsers = data.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          role: user.role || 'parent',
          isSuperAdmin: user.is_super_admin || false,
          isActive: user.is_active || false,
          isVolunteer: user.is_volunteer || false,
          phone: user.phone || '',
          createdAt: user.created_at || new Date().toISOString(),
          children: user.children_count || 0
        }));

        console.log("Formatted users:", formattedUsers);
        return formattedUsers;
        
      } catch (error: any) {
        console.error("Error in useUserRoles:", error);
        throw new Error(`Failed to load users: ${error.message}`);
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
};

export default useUserRoles;
