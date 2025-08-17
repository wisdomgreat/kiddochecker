import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/CleanAuthContext";

export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async (): Promise<Child[]> => {
      if (!user) return [];

      try {
        let query = supabase.from('children').select('*');
        
        if (userRole === 'parent') {
          query = query.eq('parent_id', user.id);
        }
        
        const { data, error } = await query.order('first_name');

        if (error) {
          console.error("Error fetching children:", error);
          throw error;
        }

        return data || [];
      } catch (error: any) {
        console.error("Error in useChildren:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  const addChildMutation = useMutation({
    mutationFn: async (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('children')
        .insert({
          ...childData,
          parent_id: user.id
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
      console.error("Error adding child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, ...childData }: Partial<Child> & { id: string }) => {
      const { data, error } = await supabase
        .from('children')
        .update(childData)
        .eq('id', id)
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
      console.error("Error updating child:", error);
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
        description: "Child removed successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove child",
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
    isDeletingChild: deleteChildMutation.isPending,
  };
};

export default useChildren;
