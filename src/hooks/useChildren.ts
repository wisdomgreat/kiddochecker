
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info?: string;
  notes?: string;
  parent_id: string;
  family_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
}

export const useChildren = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const childrenQuery = useQuery({
    queryKey: ["children", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase.from('children').select('*');
      
      // If parent, only get their children
      if (userRole === 'parent') {
        query = query.eq('parent_id', user.id);
      }
      
      const { data, error } = await query.order('first_name');
      
      if (error) throw error;
      return data as Child[];
    },
    enabled: !!user,
  });

  const addChildMutation = useMutation({
    mutationFn: async (childData: Omit<Child, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('children')
        .insert(childData)
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
    mutationFn: async ({ id, ...updateData }: Partial<Child> & { id: string }) => {
      const { data, error } = await supabase
        .from('children')
        .update(updateData)
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
    children: childrenQuery.data || [],
    isLoading: childrenQuery.isLoading,
    error: childrenQuery.error,
    addChild: addChildMutation.mutate,
    updateChild: updateChildMutation.mutate,
    deleteChild: deleteChildMutation.mutate,
    isAddingChild: addChildMutation.isPending,
    isUpdatingChild: updateChildMutation.isPending,
    isDeletingChild: deleteChildMutation.isPending,
  };
};

export const useParentChildren = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["parent-children", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase.rpc('get_parent_children_with_classes', {
        parent_user_id: user.id
      });
      
      if (error) {
        console.error("Error fetching parent children:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });
};
