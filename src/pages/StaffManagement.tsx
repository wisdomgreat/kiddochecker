
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState as useStateTeachingState } from "react";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Filter,
  Download,
  UserCog,
  Mail,
  Phone,
  Shield,
} from "lucide-react";

// Staff member form schema
const staffMemberSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  role: z.enum(["admin", "teacher"], {
    required_error: "Please select a role",
  }),
  phone: z.string().optional(),
  isSuperAdmin: z.boolean().default(false),
});

const StaffManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const staffMemberForm = useForm<z.infer<typeof staffMemberSchema>>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "teacher",
      phone: "",
      isSuperAdmin: false,
    },
  });

  const editForm = useForm<z.infer<typeof staffMemberSchema>>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "teacher",
      phone: "",
      isSuperAdmin: false,
    },
  });

  // Fetch staff members
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_staff_members");

        if (error) {
          throw error;
        }

        return data.map((member: any) => ({
          id: member.user_id,
          email: member.email,
          firstName: member.first_name,
          lastName: member.last_name,
          phone: member.phone,
          role: member.role,
          isSuperAdmin: member.is_super_admin,
          isActive: member.is_active,
        }));
      } catch (error: any) {
        console.error("Error fetching staff members:", error);
        toast({
          title: "Error",
          description: "Failed to load staff members",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Filter staff based on active tab and search term
  const filteredStaffMembers = staffMembers.filter((member) => {
    const searchMatch =
      member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return searchMatch;
    if (activeTab === "admin") return member.role === "admin" && searchMatch;
    if (activeTab === "teacher") return member.role === "teacher" && searchMatch;
    return false;
  });

  // Add Staff Member function
  const onAddStaffMember = async (values: z.infer<typeof staffMemberSchema>) => {
    try {
      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: values.email,
        password: "DefaultPassword123", // This will be changed on first login
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        },
      });

      if (error) {
        throw error;
      }

      // Set the user's role
      if (data.user) {
        const { error: roleError } = await supabase.rpc("create_user_role", {
          p_user_id: data.user.id,
          p_role: values.role,
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
      
      setIsAddDialogOpen(false);
      staffMemberForm.reset();
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
    } catch (error: any) {
      console.error("Error adding staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    }
  };

  // Edit Staff Member function
  const onEditStaffMember = async (values: z.infer<typeof staffMemberSchema>) => {
    try {
      if (!selectedStaffMember) return;

      // Update profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          phone: values.phone,
        })
        .eq("id", selectedStaffMember.id);

      if (profileError) {
        throw profileError;
      }

      // Update user role
      const { error: roleError } = await supabase.from("user_roles").update({
        role: values.role,
        is_super_admin: values.isSuperAdmin,
      }).eq("user_id", selectedStaffMember.id);

      if (roleError) {
        throw roleError;
      }

      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setSelectedStaffMember(null);
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
    } catch (error: any) {
      console.error("Error updating staff member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    }
  };

  const handleEditStaffMember = (member: any) => {
    setSelectedStaffMember(member);
    editForm.reset({
      email: member.email,
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      role: member.role,
      phone: member.phone || "",
      isSuperAdmin: member.isSuperAdmin,
    });
    setIsEditDialogOpen(true);
  };

  const staffColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: any) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium">
              {item.firstName?.[0] || ""}{item.lastName?.[0] || ""}
            </span>
          </div>
          <div>
            <div className="font-medium">{item.firstName} {item.lastName}</div>
            <div className="text-xs text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role" as const,
      header: "Role",
      render: (value: string) => (
        <div className="flex items-center">
          <div className={`p-1 rounded-full mr-2 ${
            value === "admin" ? "bg-purple-100" : "bg-blue-100"
          }`}>
            <UserCog size={16} className={`${
              value === "admin" ? "text-purple-600" : "text-blue-600"
            }`} />
          </div>
          <span className="capitalize">{value}</span>
          </div>
      ),
      sortable: true,
    },
    {
      key: "isSuperAdmin" as const,
      header: "Super Admin",
      render: (value: boolean) => (
        value ? (
          <div className="flex items-center">
            <Shield size={16} className="text-purple-600 mr-1" />
            <span className="text-xs font-medium">Yes</span>
          </div>
        ) : null
      ),
    },
    {
      key: "phone" as const,
      header: "Contact",
      render: (value: string, item: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Mail size={14} className="mr-1" />
            {item.email}
          </div>
          {value && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone size={14} className="mr-1" />
              {value}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "isActive" as const,
      header: "Status",
      render: (value: boolean) => (
        <div className="flex items-center">
          {value ? (
            <>
              <CheckCircle size={16} className="text-green-500 mr-1" />
              <span>Active</span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-gray-400 mr-1" />
              <span>Inactive</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: any) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditStaffMember(item)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-1 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your organization.
                </DialogDescription>
              </DialogHeader>
              <Form {...staffMemberForm}>
                <form onSubmit={staffMemberForm.handleSubmit(onAddStaffMember)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={staffMemberForm.control}
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
                      control={staffMemberForm.control}
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
                    control={staffMemberForm.control}
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
                    control={staffMemberForm.control}
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
                    control={staffMemberForm.control}
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
                            <SelectItem value="teacher">Teacher</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Administrators have full access, while teachers can manage their classes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {staffMemberForm.watch("role") === "admin" && (
                    <FormField
                      control={staffMemberForm.control}
                      name="isSuperAdmin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="form-checkbox h-4 w-4 text-purple-600"
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
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Staff Member</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Staff Members</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search by name, email, or role..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Staff</TabsTrigger>
              <TabsTrigger value="admin">Admins</TabsTrigger>
              <TabsTrigger value="teacher">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingStaff ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading staff members...</span>
            </div>
          ) : filteredStaffMembers.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "No results match your search criteria." 
                  : "Get started by adding your first staff member."}
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="mr-1 h-4 w-4" />
                  Add Staff Member
                </Button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={staffColumns}
              data={filteredStaffMembers}
              keyExtractor={(item) => item.id}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditStaffMember)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled {...field} />
                    </FormControl>
                    <FormDescription>
                      Email address cannot be changed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.watch("role") === "admin" && (
                <FormField
                  control={editForm.control}
                  name="isSuperAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="form-checkbox h-4 w-4 text-purple-600"
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
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Staff Member</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default StaffManagement;
