
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const addClassMutation = useMutation({
    mutationFn: async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add class",
        variant: "destructive",
      });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async (classData: Partial<Class> & { id: string }) => {
      const { data, error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', classData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  return {
    classes,
    isLoading,
    error,
    refetch,
    addClass: addClassMutation.mutate,
    updateClass: updateClassMutation.mutate,
    deleteClass: deleteClassMutation.mutate,
    isAddingClass: addClassMutation.isPending,
    isUpdatingClass: updateClassMutation.isPending,
  };
};
