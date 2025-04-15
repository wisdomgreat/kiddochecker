import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCog,
  ShieldCheck,
  Shield,
  RefreshCw,
  Plus,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { AppRole } from "@/types/supabase";

const roleSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["admin", "parent", "staff"] as const, {
    required_error: "Role is required",
  }),
  isSuperAdmin: z.boolean().default(false),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const RolesManagement = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      userId: "",
      role: "parent",
      isSuperAdmin: false,
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      try {
        const { data: staffData, error: staffError } = await supabase.rpc("get_staff_members");
        
        if (staffError) throw staffError;
        
        const { data: parentRoles, error: parentError } = await supabase
          .from("user_roles")
          .select("*, profiles(*)")
          .eq("role", "parent");
          
        if (parentError) throw parentError;
        
        const staffMembers = staffData.map((staff: any) => ({
          id: staff.user_id,
          email: staff.email,
          firstName: staff.first_name || '',
          lastName: staff.last_name || '',
          role: staff.role,
          isSuperAdmin: staff.is_super_admin,
          isActive: staff.is_active,
        }));
        
        const parentMembers = (parentRoles || []).map((parent: any) => ({
          id: parent.user_id,
          email: '',
          firstName: parent.profiles?.first_name || '',
          lastName: parent.profiles?.last_name || '',
          role: 'parent',
          isSuperAdmin: parent.is_super_admin,
          isActive: true,
        }));
        
        return [...staffMembers, ...parentMembers];
      } catch (error: any) {
        console.error("Error fetching users with roles:", error);
        toast({
          title: "Error",
          description: "Failed to load users and roles",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const handleEditRole = async (values: RoleFormValues) => {
    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: values.role })
        .eq("user_id", values.userId);

      if (roleError) throw roleError;

      if (values.role === "admin") {
        const { error: adminError } = await supabase
          .from("user_roles")
          .update({ is_super_admin: values.isSuperAdmin })
          .eq("user_id", values.userId);

        if (adminError) throw adminError;
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setIsEditOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      userId: user.id,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });
    setIsEditOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminUsers = filteredUsers.filter((user) => user.role === "admin");
  const teacherUsers = filteredUsers.filter((user) => user.role === "teacher");
  const parentUsers = filteredUsers.filter((user) => user.role === "parent");

  const userColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: any) => (
        <div>
          <div className="font-medium">
            {item.firstName} {item.lastName}
          </div>
          <div className="text-sm text-gray-500">{item.email}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role" as const,
      header: "Role",
      render: (value: string) => (
        <div className="capitalize">{value}</div>
      ),
      sortable: true,
    },
    {
      key: "isSuperAdmin" as const,
      header: "Super Admin",
      render: (value: boolean) => (
        <div className="flex items-center">
          {value ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-300" />
          )}
          <span className="sr-only">{value ? "Yes" : "No"}</span>
        </div>
      ),
    },
    {
      key: "isActive" as const,
      header: "Status",
      render: (value: boolean) => (
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </div>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditDialog(item)}
        >
          Edit Role
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-gray-500">Manage user roles and access permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle>Admin</CardTitle>
            </div>
            <CardDescription>Full access to all systems</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{adminUsers.length}</p>
            <p className="text-sm text-gray-500">Total administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <UserCog className="h-5 w-5 text-blue-600" />
              <CardTitle>Teachers</CardTitle>
            </div>
            <CardDescription>Can manage classes and students</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teacherUsers.length}</p>
            <p className="text-sm text-gray-500">Total teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <CardTitle>Parents</CardTitle>
            </div>
            <CardDescription>Can manage their children</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{parentUsers.length}</p>
            <p className="text-sm text-gray-500">Total parents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Roles</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Manage roles and permissions for each user
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="all" className="px-6">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="teacher">Teachers</TabsTrigger>
            <TabsTrigger value="parent">Parents</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center">
                <UserCog className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No users found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No users match your search criteria."
                    : "Add users to get started."}
                </p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            )}
          </TabsContent>

          <TabsContent value="admin" className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2">Loading admins...</span>
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No admins found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No admins match your search criteria."
                    : "Assign admin roles to users to get started."}
                </p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={adminUsers}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            )}
          </TabsContent>

          <TabsContent value="teacher" className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2">Loading teachers...</span>
              </div>
            ) : teacherUsers.length === 0 ? (
              <div className="py-8 text-center">
                <UserCog className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No teachers found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No teachers match your search criteria."
                    : "Assign teacher roles to users to get started."}
                </p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={teacherUsers}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            )}
          </TabsContent>

          <TabsContent value="parent" className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2">Loading parents...</span>
              </div>
            ) : parentUsers.length === 0 ? (
              <div className="py-8 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No parents found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? "No parents match your search criteria."
                    : "Parents will be added when they register."}
                </p>
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={parentUsers}
                keyExtractor={(item) => item.id}
                searchable={false}
              />
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>
            Understand the different roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Admin</h3>
              </div>
              <ul className="text-sm space-y-1 pl-5 list-disc text-gray-700">
                <li>Full access to all system features</li>
                <li>Can manage all users and roles</li>
                <li>Can configure organization settings</li>
                <li>Can manage classes and events</li>
                <li>Can access all reports and analytics</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserCog className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Teacher</h3>
              </div>
              <ul className="text-sm space-y-1 pl-5 list-disc text-gray-700">
                <li>Can view and manage assigned classes</li>
                <li>Can view student information</li>
                <li>Can check in/out children in their class</li>
                <li>Can manage events</li>
                <li>Limited access to reports</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Parent</h3>
              </div>
              <ul className="text-sm space-y-1 pl-5 list-disc text-gray-700">
                <li>Can manage their children's profiles</li>
                <li>Can view their children's check-in/out history</li>
                <li>Can receive notifications about their children</li>
                <li>Can view upcoming events</li>
                <li>Limited access to their own data only</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update role and permissions for {selectedUser?.firstName}{" "}
              {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditRole)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
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

              {editForm.watch("role") === "admin" && (
                <FormField
                  control={editForm.control}
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

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default RolesManagement;
