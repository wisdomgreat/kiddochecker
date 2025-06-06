
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDatabaseFunctions } from "@/hooks/useDatabaseFunctions";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { executeFunction } = useDatabaseFunctions();

  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: ["children"],
    queryFn: async (): Promise<Child[]> => {
      try {
        // Use a direct query but avoid joins that might cause recursion
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

  const addChildMutation = useMutation({
    mutationFn: async (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('children')
        .insert({
          ...childData,
          parent_id: (await supabase.auth.getUser()).data.user?.id || childData.parent_id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast({
        title: "Success",
        description: "Child added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async (childData: Partial<Child> & { id: string }) => {
      const { data, error } = await supabase
        .from('children')
        .update(childData)
        .eq('id', childData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast({
        title: "Success",
        description: "Child updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update child",
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast({
        title: "Success",
        description: "Child deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete child",
        variant: "destructive",
      });
    },
  });

  return {
    children,
    isLoading,
    error,
    refetch,
    addChild: addChildMutation.mutate,
    updateChild: updateChildMutation.mutate,
    deleteChild: deleteChildMutation.mutate,
    isAddingChild: addChildMutation.isPending,
    isUpdatingChild: updateChildMutation.isPending,
  };
};

export const useParentChildren = () => {
  const { executeFunction } = useDatabaseFunctions();

  const { data: childrenWithClasses, isLoading } = useQuery({
    queryKey: ["parent-children-with-classes"],
    queryFn: async () => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return [];
        
        return await executeFunction<any[]>('get_parent_children_with_classes', {
          parent_user_id: userId
        }) || [];
      } catch (error: any) {
        console.error("Error in useParentChildren:", error);
        return [];
      }
    },
  });

  return {
    data: childrenWithClasses || [],
    isLoading
  };
};
