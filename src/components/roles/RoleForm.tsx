
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppRole } from "@/types/supabase";

// Define a type that's strictly limited to the database enum values
const roleSchema = z.object({
  userId: z.string().min(1, "User is required"),
  // Define a specific subset of roles that match what the database expects
  role: z.enum(["admin", "staff", "parent", "super_admin", "teacher", "teacher_assistant"] as const, {
    required_error: "Role is required",
  }),
  isSuperAdmin: z.boolean().default(false),
  isVolunteer: z.boolean().default(false),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: any | null;
  onSubmit: (values: RoleFormValues) => Promise<void>;
}

const RoleForm = ({ isOpen, onOpenChange, selectedUser, onSubmit }: RoleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      userId: selectedUser?.id || "",
      role: (selectedUser?.role || "parent") as any,
      isSuperAdmin: selectedUser?.roleData?.is_super_admin || false,
      isVolunteer: selectedUser?.roleData?.is_volunteer || false,
    },
  });

  // Reset form when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        userId: selectedUser.id,
        role: (selectedUser.role || "parent") as any,
        isSuperAdmin: !!selectedUser.roleData?.is_super_admin,
        isVolunteer: !!selectedUser.roleData?.is_volunteer,
      });
    }
  }, [selectedUser, form]);

  const handleSubmit = async (values: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Update role and permissions for {selectedUser?.firstName}{" "}
            {selectedUser?.lastName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} type="hidden" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "parent"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The user's primary role in the system
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
                      Mark this user as a volunteer
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
                {isSubmitting ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleForm;
