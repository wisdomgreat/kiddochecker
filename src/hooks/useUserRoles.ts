
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, formatUserData } from "@/types/users";

const useUserRoles = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        console.log("Fetching users with roles...");
        
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

        const formattedUsers = data.map((user: any) => formatUserData({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_super_admin: user.is_super_admin,
          is_active: user.is_active,
          created_at: new Date().toISOString(),
          phone: '',
          children: 0
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
