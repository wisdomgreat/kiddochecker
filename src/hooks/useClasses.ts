
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@/types/classes";

export const useClasses = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes",
          variant: "destructive",
        });
        throw error;
      }

      return data as Class[];
    },
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newClass: {
      name: string;
      description?: string;
      ageRange?: string;
      capacity?: number;
      room?: string;
      teacherId?: string;
    }) => {
      console.log("Creating class using RPC function:", newClass);
      
      // Use our new RPC function to avoid ambiguous column references
      const { data, error } = await supabase.rpc('create_class_teacher_assignment', {
        p_class_name: newClass.name,
        p_description: newClass.description || '',
        p_age_range: newClass.ageRange || '',
        p_capacity: newClass.capacity || null,
        p_room: newClass.room || '',
        p_teacher_id: newClass.teacherId || null
      });

      if (error) {
        console.error("Error creating class:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in create class mutation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create class",
        variant: "destructive",
      });
    },
  });
};
