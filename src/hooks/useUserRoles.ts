
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/users";
import { AppRole } from "@/types/supabase";

interface UserWithRoleRPC {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole | null;
  is_super_admin: boolean | null;
  is_active: boolean | null;
  is_volunteer: boolean | null;
  phone: string | null;
  created_at: string | null;
  children_count: number | null;
}

const useUserRoles = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        console.log("Fetching users with roles...");
        
        let usersData: any[] = [];
        const { data, error } = await supabase.rpc('get_users_with_roles');

        if (!error && data && data.length > 0) {
          usersData = data;
        } else {
          console.warn("get_users_with_roles returned empty or error, falling back to profiles table:", error);
          const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*');
          if (profileErr) {
            console.error("Fallback profiles query error:", profileErr);
            throw profileErr;
          }
          usersData = profiles || [];
        }

        console.log("Raw user data:", usersData);

        const formattedUsers: UserProfile[] = usersData.map((user: any) => ({
          id: user.id,
          email: user.email || '',
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          role: user.role || 'parent',
          isSuperAdmin: user.is_super_admin ?? user.isSuperAdmin ?? false,
          isActive: user.is_active ?? user.isActive ?? true,
          isVolunteer: user.is_volunteer ?? user.isVolunteer ?? false,
          phone: user.phone || '',
          createdAt: user.created_at || user.createdAt || new Date().toISOString(),
          children: user.children_count ?? user.children ?? 0
        }));

        console.log("Formatted users:", formattedUsers);
        return formattedUsers;
        
      } catch (error: any) {
        console.error("Error in useUserRoles:", error);
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
  });
};

export default useUserRoles;

