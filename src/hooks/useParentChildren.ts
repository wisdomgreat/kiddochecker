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
        // First try to use the database function if it exists
        const { data: functionData, error: functionError } = await supabase.rpc('get_parent_children_with_classes', {
          parent_user_id: user.id
        });

        if (!functionError && functionData) {
          return functionData.map((child: any) => ({
            child_id: child.child_id,
            first_name: child.first_name,
            last_name: child.last_name,
            age: child.age,
            allergies: child.allergies,
            medical_info: child.medical_info,
            emergency_contact_name: child.emergency_contact_name,
            emergency_contact_phone: child.emergency_contact_phone,
            notes: child.notes,
            current_class_name: child.current_class_name
          }));
        }

        // Fallback to direct query if function doesn't exist
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
          current_class_name: undefined
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

