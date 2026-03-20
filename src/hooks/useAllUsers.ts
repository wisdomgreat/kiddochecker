
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/types/supabase";

export interface AllUsersData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: AppRole;
  is_super_admin: boolean;
  is_active: boolean;
  is_volunteer: boolean;
  created_at: string;
  user_type: 'staff' | 'parent' | 'admin' | 'volunteer';
  children_count?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  gender?: string;
  occupation?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export const useAllUsers = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["all-users"],
    queryFn: async (): Promise<AllUsersData[]> => {
      try {
        console.log("Fetching all registered users...");
        
        const { data, error } = await supabase.rpc('get_users_with_roles');

        if (error) {
          console.error("Error fetching all users:", error);
          toast({
            title: "Error Loading Users",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("No users found in the system");
          return [];
        }

        // Transform and categorize users
        const users = data.map((user: any) => {
          let user_type: 'staff' | 'parent' | 'admin' = 'parent';
          
          if (['admin', 'super_admin'].includes(user.role)) {
            user_type = 'admin';
          } else if (['staff', 'teacher', 'teacher_assistant'].includes(user.role)) {
            user_type = 'staff';
          }

          return {
            id: user.id,
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: user.role as AppRole,
            is_super_admin: user.is_super_admin || false,
            is_active: user.is_active !== false,
            is_volunteer: user.is_volunteer || false,
            created_at: user.created_at || new Date().toISOString(),
            user_type,
            children_count: user.children_count || 0,
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            zip: user.zip || '',
            gender: user.gender || '',
            occupation: user.occupation || '',
            emergency_contact_name: user.emergency_contact_name || '',
            emergency_contact_phone: user.emergency_contact_phone || '',
          };
        });

        console.log(`Successfully loaded ${users.length} users`);
        return users;

      } catch (error: any) {
        console.error("Error in useAllUsers:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please check your connection and try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};
