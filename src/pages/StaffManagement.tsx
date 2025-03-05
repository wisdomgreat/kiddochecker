import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  UserPlus, Search, MoreHorizontal, CheckCircle, 
  XCircle, Check, X, Shield, ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MainLayout from "@/components/layout/MainLayout";

const staffFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters",
  }),
  phone: z.string().optional(),
  role: z.enum(["admin", "staff"]),
  isSuperAdmin: z.boolean().default(false),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "admin" | "staff" | "parent";
  isSuperAdmin: boolean;
  isActive: boolean;
}

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      phone: "",
      role: "staff",
      isSuperAdmin: false,
    },
  });

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_staff_members');
      
      if (error) throw error;
      
      if (data) {
        const formattedStaff: StaffMember[] = data.map((staff: any) => ({
          id: staff.user_id,
          email: staff.email || '',
          firstName: staff.first_name || '',
          lastName: staff.last_name || '',
          phone: staff.phone || '',
          role: staff.role as "admin" | "staff" | "parent",
          isSuperAdmin: staff.is_super_admin || false,
          isActive: staff.is_active
        }));
        
        setStaffMembers(formattedStaff);
      }
    } catch (error) {
      console.error("Error fetching staff members:", error);
      toast({
        title: "Failed to load staff members",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: StaffFormValues) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        }
      });
      
      if (userError) throw userError;
      
      if (!userData.user) throw new Error("Failed to create user");
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: values.role,
          is_super_admin: values.isSuperAdmin
        })
        .eq('user_id', userData.user.id);
        
      if (roleError) throw roleError;
      
      toast({
        title: "Staff Member Created",
        description: `${values.firstName} ${values.lastName} has been added as ${values.role}`,
      });
      
      form.reset();
      setIsCreateDialogOpen(false);
      fetchStaffMembers();
    } catch (error: any) {
      console.error("Error creating staff member:", error);
      toast({
        title: "Failed to Create Staff Member",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "staff") => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      setStaffMembers(prevStaff => 
        prevStaff.map(staff => 
          staff.id === userId ? { ...staff, role: newRole } : staff
        )
      );
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Role Update Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleSuperAdminToggle = async (userId: string, isSuperAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_super_admin: isSuperAdmin })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      setStaffMembers(prevStaff => 
        prevStaff.map(staff => 
          staff.id === userId ? { ...staff, isSuperAdmin } : staff
        )
      );
      
      toast({
        title: isSuperAdmin ? "Super Admin Granted" : "Super Admin Revoked",
        description: `User's super admin status has been updated`,
      });
    } catch (error) {
      console.error("Error updating super admin status:", error);
      toast({
        title: "Status Update Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const query = searchQuery.toLowerCase();
    return (
      staff.email.toLowerCase().includes(query) ||
      staff.firstName.toLowerCase().includes(query) ||
      staff.lastName.toLowerCase().includes(query) ||
      (staff.phone && staff.phone.includes(query))
    );
  });

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create an account for a staff member or administrator.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
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
                          <Input placeholder="Last name" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Temporary password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Staff member can change this after first login.
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
                        <Input placeholder="Phone number" {...field} />
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Staff can only access assigned classes. Administrators have full system access.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isSuperAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Super Administrator</FormLabel>
                        <FormDescription>
                          Super administrators can manage other administrators and system-wide settings.
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
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Staff Member</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <span>Loading staff members...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {searchQuery ? (
                    <p>No staff members found matching "{searchQuery}"</p>
                  ) : (
                    <p>No staff members found. Add your first staff member to get started.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {staff.isSuperAdmin && (
                        <ShieldAlert
                          className="text-orange-500"
                          size={16}
                          aria-label="Super Admin"
                        />
                      )}
                      {`${staff.firstName} ${staff.lastName}`}
                    </div>
                  </TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staff.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {staff.role === 'admin' ? 'Administrator' : 'Staff'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {staff.isActive ? (
                      <span className="inline-flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-500">
                        <XCircle className="h-4 w-4 mr-1" />
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {staff.role === 'staff' ? (
                          <DropdownMenuItem onClick={() => handleRoleChange(staff.id, 'admin')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Administrator
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRoleChange(staff.id, 'staff')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Make Staff
                          </DropdownMenuItem>
                        )}
                        {staff.isSuperAdmin ? (
                          <DropdownMenuItem onClick={() => handleSuperAdminToggle(staff.id, false)}>
                            <X className="h-4 w-4 mr-2" />
                            Remove Super Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleSuperAdminToggle(staff.id, true)}>
                            <Check className="h-4 w-4 mr-2" />
                            Make Super Admin
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
};

export default StaffManagement;
