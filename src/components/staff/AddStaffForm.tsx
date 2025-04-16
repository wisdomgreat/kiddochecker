import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AppRole } from "@/types/supabase";

// Define a schema that matches what the database expects
const staffMemberSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  role: z.enum(['admin', 'staff', 'teacher', 'parent', 'super_admin'] as const, {
    required_error: "Please select a role",
  }),
  phone: z.string().optional(),
  isSuperAdmin: z.boolean().default(false),
});

export type StaffFormValues = z.infer<typeof staffMemberSchema>;

interface AddStaffFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddStaffForm = ({ open, onOpenChange, onSuccess }: AddStaffFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "staff",
      phone: "",
      isSuperAdmin: false,
    },
  });

  const handleSubmit = async (values: StaffFormValues) => {
    setIsSubmitting(true);

    try {
      // Create the user with a default password
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        password: "DefaultPassword123", // Will be changed on first login
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        },
      });

      if (error) throw error;

      // Set the user's role if user was created successfully
      if (data.user) {
        const { error: roleError } = await supabase.rpc("create_user_role", {
          p_user_id: data.user.id,
          p_role: values.role as AppRole,
          p_is_super_admin: values.isSuperAdmin,
        });

        if (roleError) {
          throw roleError;
        }
      }

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      
      form.reset();
      onOpenChange(false);
      
      // Invalidate staff members query
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error adding staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to your organization.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The staff member will receive an email to set their password.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
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
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Administrators have full access, teachers manage classes, and staff provide support.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchRole === "admin" && (
              <FormField
                control={form.control}
                name="isSuperAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make Super Admin
                      </FormLabel>
                      <FormDescription>
                        Super admins have unrestricted access to all system features.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="pt-4 sticky bottom-0 bg-white pb-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffForm;
