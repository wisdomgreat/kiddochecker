
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
  parent_id: string;
  allergies?: string;
  medical_info?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: ["children"],
    queryFn: async (): Promise<Child[]> => {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .order('first_name');

        if (error) {
          console.error("Error fetching children:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useChildren:", error);
        throw new Error(`Failed to load children: ${error.message}`);
      }
    },
  });

  return {
    children,
    isLoading,
    error,
    refetch
  };
};
