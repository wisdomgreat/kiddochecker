
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Class {
  id: string;
  name: string;
  description?: string;
  age_range?: string;
  capacity?: number;
  room?: string;
  created_at: string;
  updated_at: string;
}

export const useClasses = () => {
  const { data: classes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["classes"],
    queryFn: async (): Promise<Class[]> => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('name');

        if (error) {
          console.error("Error fetching classes:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useClasses:", error);
        throw new Error(`Failed to load classes: ${error.message}`);
      }
    },
  });

  return {
    classes,
    isLoading,
    error,
    refetch
  };
};
