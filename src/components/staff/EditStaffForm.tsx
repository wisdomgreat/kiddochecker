
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { StaffMember } from "@/types/supabase";

// Define the staff roles type explicitly instead of using AppRole
type StaffRole = "admin" | "staff" | "teacher" | "teacher_assistant";

const staffEditFormSchema = z.object({
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
  isActive: z.boolean().default(true),
});

type StaffEditFormValues = z.infer<typeof staffEditFormSchema>;

interface EditStaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: StaffMember;
  onSuccess: () => void;
}

const EditStaffForm = ({ 
  open, 
  onOpenChange, 
  staffMember,
  onSuccess 
}: EditStaffFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<StaffEditFormValues>({
    resolver: zodResolver(staffEditFormSchema),
    defaultValues: {
      firstName: staffMember.first_name || "",
      lastName: staffMember.last_name || "",
      phone: staffMember.phone || "",
      role: (staffMember.role as StaffRole) || "teacher",
      isSuperAdmin: staffMember.is_super_admin || false,
      isVolunteer: staffMember.is_volunteer || false,
      isActive: staffMember.is_active || false,
    },
  });
  
  const handleSubmit = async (values: StaffEditFormValues) => {
    try {
      setIsSubmitting(true);
      
      // 1. Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        })
        .eq('id', staffMember.user_id);
      
      if (profileError) throw profileError;
      
      // 2. Update user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: values.role,
          is_super_admin: values.isSuperAdmin,
          is_volunteer: values.isVolunteer,
        })
        .eq('user_id', staffMember.user_id);
      
      if (roleError) throw roleError;
      
      toast({
        title: "Success",
        description: "Staff member has been updated successfully"
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
      <DialogContent className="sm:max-w-[525px]">
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
                      <Input {...field} />
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
                      <Input {...field} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Super Admin
                      </FormLabel>
                      <FormDescription>
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Volunteer
                    </FormLabel>
                    <FormDescription>
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
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Active Status
                    </FormLabel>
                    <FormDescription>
                      Inactive users cannot sign in to the system
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

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffForm;
