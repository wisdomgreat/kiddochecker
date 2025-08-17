
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const teacherSchema = z.object({
  teacherId: z.string().min(1, "Teacher is required"),
});

interface StaffMember {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface AssignTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  onSuccess?: () => void;
}

export const AssignTeacherForm = ({
  open,
  onOpenChange,
  classId,
  className,
  onSuccess,
}: AssignTeacherFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof teacherSchema>>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      teacherId: "",
    },
  });

  // Fetch staff members with teacher role
  useEffect(() => {
    const fetchStaffMembers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_staff_members');

        if (error) {
          throw error;
        }

        // Filter to get only teachers
        const teachers = data.filter((member: any) => 
          member.role === 'teacher' || member.role === 'admin'
        );

        setStaffMembers(teachers);
      } catch (error: any) {
        console.error('Error fetching staff members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teachers',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchStaffMembers();
    }
  }, [open, toast]);

  const handleSubmit = async (values: z.infer<typeof teacherSchema>) => {
    setIsSubmitting(true);

    try {
      // Check if teacher is already assigned to this class
      const { data: existingAssignment, error: checkError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', values.teacherId)
        .eq('class_id', classId);

      if (checkError) throw checkError;

      if (existingAssignment && existingAssignment.length > 0) {
        toast({
          title: 'Already Assigned',
          description: 'This teacher is already assigned to this class',
          variant: 'default',
        });
        setIsSubmitting(false);
        return;
      }

      // Assign teacher to class
      const { error } = await supabase
        .from('teachers')
        .insert({
          user_id: values.teacherId,
          class_id: classId,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Teacher assigned to class successfully',
      });

      form.reset();
      onOpenChange(false);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: [`class-${classId}`] });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error assigning teacher:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign teacher to class',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Teacher to Class</DialogTitle>
          <DialogDescription>
            Assign a teacher to the class "{className}".
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Teacher</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading teachers...
                        </SelectItem>
                      ) : staffMembers.length === 0 ? (
                        <SelectItem value="none-available" disabled>
                          No teachers available
                        </SelectItem>
                      ) : (
                        staffMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Teachers will have access to manage this class and its students.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !form.watch("teacherId")}
              >
                {isSubmitting ? "Assigning..." : "Assign Teacher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTeacherForm;
