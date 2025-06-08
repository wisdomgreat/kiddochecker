
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: ["children"],
    queryFn: async (): Promise<Child[]> => {
      try {
        console.log("Fetching children...");
        
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .order('first_name');

        if (error) {
          console.error("Error fetching children:", error);
          throw error;
        }

        console.log("Children data received:", data);
        return data || [];
      } catch (error: any) {
        console.error("Error in useChildren:", error);
        throw new Error(`Failed to load children: ${error.message}`);
      }
    },
  });

  const addChildMutation = useMutation({
    mutationFn: async (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
      console.log("Adding child:", childData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('children')
        .insert({
          ...childData,
          parent_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding child:", error);
        throw error;
      }
      
      console.log("Child added successfully:", data);
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
      console.error("Error in addChildMutation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async (childData: Partial<Child> & { id: string }) => {
      console.log("Updating child:", childData);
      
      const { data, error } = await supabase
        .from('children')
        .update(childData)
        .eq('id', childData.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating child:", error);
        throw error;
      }
      
      console.log("Child updated successfully:", data);
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
      console.error("Error in updateChildMutation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update child",
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      console.log("Deleting child:", childId);
      
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) {
        console.error("Error deleting child:", error);
        throw error;
      }
      
      console.log("Child deleted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      toast({
        title: "Success",
        description: "Child deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in deleteChildMutation:", error);
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
  const { data: childrenWithClasses, isLoading } = useQuery({
    queryKey: ["parent-children-with-classes"],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        
        const { data, error } = await supabase.rpc('get_parent_children_with_classes', {
          parent_user_id: user.id
        });
        
        if (error) {
          console.error("Error fetching parent children:", error);
          return [];
        }
        
        return data || [];
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
