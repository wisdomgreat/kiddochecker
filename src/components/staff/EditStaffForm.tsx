
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useStaff, StaffMember } from "@/hooks/useStaff";

const editStaffFormSchema = z.object({
  firstName: z.string().min(1, {
    message: "First name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required.",
  }),
  phone: z.string().optional(),
  role: z.enum(["admin", "staff", "teacher", "teacher_assistant"] as const, {
    required_error: "Please select a role.",
  }),
  isSuperAdmin: z.boolean().default(false),
  isVolunteer: z.boolean().default(false),
});

type EditStaffFormValues = z.infer<typeof editStaffFormSchema>;

interface EditStaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: StaffMember;
  onSuccess: () => void;
}

const EditStaffForm = ({ open, onOpenChange, staffMember, onSuccess }: EditStaffFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { updateStaff } = useStaff();
  
  const form = useForm<EditStaffFormValues>({
    resolver: zodResolver(editStaffFormSchema),
    defaultValues: {
      firstName: staffMember.first_name || "",
      lastName: staffMember.last_name || "",
      phone: staffMember.phone || "",
      role: staffMember.role as any || "teacher",
      isSuperAdmin: staffMember.is_super_admin || false,
      isVolunteer: staffMember.is_volunteer || false,
    },
  });

  useEffect(() => {
    if (staffMember) {
      form.reset({
        firstName: staffMember.first_name || "",
        lastName: staffMember.last_name || "",
        phone: staffMember.phone || "",
        role: staffMember.role as any || "teacher",
        isSuperAdmin: staffMember.is_super_admin || false,
        isVolunteer: staffMember.is_volunteer || false,
      });
    }
  }, [staffMember, form]);
  
  const handleSubmit = async (values: EditStaffFormValues) => {
    try {
      setIsSubmitting(true);
      
      updateStaff({
        userId: staffMember.user_id,
        updates: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
          role: values.role,
          is_super_admin: values.isSuperAdmin,
          is_volunteer: values.isVolunteer,
        }
      });
      
      onOpenChange(false);
      onSuccess();
      
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Could not update staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update information for {staffMember.first_name} {staffMember.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                      <SelectItem value="staff">General Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the appropriate role for this staff member
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("role") === "admin" && (
              <FormField
                control={form.control}
                name="isSuperAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Super Admin
                      </FormLabel>
                      <FormDescription className="text-sm">
                        Super admins have unrestricted access to all features
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isVolunteer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Volunteer
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Mark this person as a volunteer rather than paid staff
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffForm;
