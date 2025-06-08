
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ParentChild {
  child_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  current_class_name?: string;
}

export const useParentChildren = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: async (): Promise<ParentChild[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('children')
          .select(`
            id,
            first_name,
            last_name,
            age,
            allergies,
            medical_info,
            emergency_contact_name,
            emergency_contact_phone,
            notes
          `)
          .eq('parent_id', user.id)
          .order('first_name');

        if (error) {
          console.error("Error fetching parent children:", error);
          throw error;
        }

        // Transform the data to match the expected interface
        return (data || []).map(child => ({
          child_id: child.id,
          first_name: child.first_name,
          last_name: child.last_name,
          age: child.age,
          allergies: child.allergies,
          medical_info: child.medical_info,
          emergency_contact_name: child.emergency_contact_name,
          emergency_contact_phone: child.emergency_contact_phone,
          notes: child.notes,
          current_class_name: undefined // This would need to be fetched from attendance/class assignments
        }));
      } catch (error: any) {
        console.error("Error in useParentChildren:", error);
        return [];
      }
    },
    enabled: !!user,
  });
};

export default useParentChildren;
