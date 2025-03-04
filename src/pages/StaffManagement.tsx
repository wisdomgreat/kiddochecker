
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, UserPlus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for staff
const staffSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters."
  }),
  firstName: z.string().min(1, {
    message: "First name is required."
  }),
  lastName: z.string().min(1, {
    message: "Last name is required."
  }),
  phone: z.string().optional(),
  role: z.enum(["staff", "admin"]),
});

type StaffFormValues = z.infer<typeof staffSchema>;

type StaffMember = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_super_admin?: boolean;
  created_at: string;
};

const StaffManagement = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "staff",
    },
  });

  // Fetch staff list
  const fetchStaffList = async () => {
    try {
      setLoading(true);
      
      // Get all staff and admin users
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          is_super_admin,
          profiles:user_id (
            id,
            email:id,
            first_name,
            last_name,
            created_at
          )
        `)
        .in('role', ['staff', 'admin'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Format data for display
      const formattedStaff = data.map(item => ({
        id: item.user_id,
        email: item.profiles?.email || '',
        first_name: item.profiles?.first_name || '',
        last_name: item.profiles?.last_name || '',
        role: item.role,
        is_super_admin: item.is_super_admin,
        created_at: item.profiles?.created_at || '',
      }));
      
      setStaffList(formattedStaff);
    } catch (error: any) {
      console.error('Error fetching staff list:', error);
      toast({
        title: "Failed to load staff",
        description: error.message || "Could not load staff list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    fetchStaffList();
  }, [userRole, navigate]);

  const handleCreateStaff = async (values: StaffFormValues) => {
    try {
      // 1. Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
        user_metadata: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone || null,
        }
      });

      if (authError) throw authError;
      
      // 2. Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: values.role,
          is_super_admin: false
        });
        
      if (roleError) throw roleError;
      
      toast({
        title: "Staff Created",
        description: `${values.firstName} ${values.lastName} has been added as ${values.role}`,
      });
      
      // Close dialog and refresh list
      setOpenStaffDialog(false);
      form.reset();
      fetchStaffList();
      
    } catch (error: any) {
      toast({
        title: "Failed to create staff",
        description: error.message || "An error occurred while creating staff",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async (staffId: string, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(staffId);
      
      if (error) throw error;
      
      toast({
        title: "Staff Deleted",
        description: "Staff member has been removed",
      });
      
      fetchStaffList();
    } catch (error: any) {
      toast({
        title: "Failed to delete staff",
        description: error.message || "An error occurred while deleting staff",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Dialog open={openStaffDialog} onOpenChange={setOpenStaffDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account with appropriate permissions
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateStaff)} className="space-y-4 py-4">
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
                        <Input type="email" placeholder="staff@example.com" {...field} />
                      </FormControl>
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Create password" 
                            {...field} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
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
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setOpenStaffDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Staff</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Staff & Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading staff data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {staff.is_super_admin && <ShieldCheck className="h-4 w-4 text-purple-500" title="Super Admin" />}
                        {staff.first_name} {staff.last_name}
                      </div>
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell className="capitalize">{staff.role}</TableCell>
                    <TableCell>{new Date(staff.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Edit"
                          onClick={() => setEditingStaff(staff)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          title="Delete"
                          onClick={() => handleDeleteStaff(staff.id, staff.id === user?.id)}
                          disabled={staff.id === user?.id || staff.is_super_admin}
                          className={staff.id === user?.id || staff.is_super_admin ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {staffList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No staff members found. Add your first staff member to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffManagement;
