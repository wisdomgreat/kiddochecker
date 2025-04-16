import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  Lock,
  Settings,
  PlusCircle,
  Edit,
  Trash2,
  Filter,
  Save,
  X,
  ShieldAlert,
  ShieldPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { AppRole, CustomRole, Permission, RolePermission } from "@/types/supabase";

const RolePermissionsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("roles");
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [isAssignPermissionsOpen, setIsAssignPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [userRole, toast]);

  const roleForm = useForm<CustomRoleFormValues>({
    resolver: zodResolver(customRoleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const permissionForm = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      resource: "",
      action: "",
    },
  });

  const assignPermissionsForm = useForm<PermissionAssignmentFormValues>({
    resolver: zodResolver(permissionAssignmentSchema),
    defaultValues: {
      roleId: "",
      permissions: [],
    },
  });

  const { data: customRoles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("custom_roles")
          .select("*")
          .order("name");

        if (error) throw error;
        return data as CustomRole[];
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load roles",
          variant: "destructive",
        });
        console.error("Error loading roles:", error);
        return [];
      }
    },
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("permissions")
          .select("*")
          .order("name");

        if (error) throw error;
        return data as Permission[];
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load permissions",
          variant: "destructive",
        });
        console.error("Error loading permissions:", error);
        return [];
      }
    },
  });

  const { data: rolePermissions = [], isLoading: isLoadingRolePermissions } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("role_permissions")
          .select("*");

        if (error) throw error;
        return data as RolePermission[];
      } catch (error: any) {
        console.error("Error loading role permissions:", error);
        return [];
      }
    },
  });

  const handleAddRole = async (values: CustomRoleFormValues) => {
    try {
      const { data, error } = await supabase
        .from("custom_roles")
        .insert({
          name: values.name,
          description: values.description,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role created successfully",
      });

      setIsAddRoleOpen(false);
      roleForm.reset();
      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddPermission = async (values: PermissionFormValues) => {
    try {
      const { data, error } = await supabase
        .from("permissions")
        .insert({
          name: values.name,
          description: values.description,
          resource: values.resource,
          action: values.action,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permission created successfully",
      });

      setIsAddPermissionOpen(false);
      permissionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignPermissions = async (values: PermissionAssignmentFormValues) => {
    try {
      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", values.roleId);

      if (deleteError) throw deleteError;

      if (values.permissions.length > 0) {
        const insertData = values.permissions.map(permissionId => ({
          role_id: values.roleId,
          permission_id: permissionId,
        }));

        const { error: insertError } = await supabase
          .from("role_permissions")
          .insert(insertData);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Permissions assigned successfully",
      });

      setIsAssignPermissionsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("custom_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["custom-roles"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from("permissions")
        .delete()
        .eq("id", permissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenAssignPermissions = (role: CustomRole) => {
    setSelectedRole(role);
    
    const currentPermissions = rolePermissions
      .filter(rp => rp.role_id === role.id)
      .map(rp => rp.permission_id);
    
    assignPermissionsForm.reset({
      roleId: role.id,
      permissions: currentPermissions,
    });
    
    setIsAssignPermissionsOpen(true);
  };

  const roleColumns = [
    {
      key: "name" as const,
      header: "Role Name",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "description" as const,
      header: "Description",
      render: (value: string) => value || "-",
    },
    {
      key: "created_at" as const,
      header: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: CustomRole) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignPermissions(item)}
          >
            <ShieldPlus className="h-4 w-4 mr-1" />
            Permissions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDeleteRole(item.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const permissionColumns = [
    {
      key: "name" as const,
      header: "Permission Name",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "resource" as const,
      header: "Resource",
      render: (value: string) => value,
    },
    {
      key: "action" as const,
      header: "Action",
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === "read" ? "bg-blue-100 text-blue-800" :
          value === "create" ? "bg-green-100 text-green-800" :
          value === "update" ? "bg-yellow-100 text-yellow-800" :
          value === "delete" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: "description" as const,
      header: "Description",
      render: (value: string) => value || "-",
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: Permission) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleDeletePermission(item.id)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      ),
    },
  ];

  const handlePermissionCheckboxChange = (permissionId: string) => {
    const currentPermissions = assignPermissionsForm.getValues("permissions") || [];
    const updatedPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(id => id !== permissionId)
      : [...currentPermissions, permissionId];
    
    assignPermissionsForm.setValue("permissions", updatedPermissions);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Role & Permission Management</h1>
          <p className="text-gray-500">
            Manage roles, permissions, and their assignments
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-1" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Lock className="h-4 w-4 mr-1" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="system-roles">
            <ShieldAlert className="h-4 w-4 mr-1" />
            System Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Custom Roles</CardTitle>
              <Button onClick={() => setIsAddRoleOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Role
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="py-8 text-center">Loading roles...</div>
              ) : customRoles.length === 0 ? (
                <div className="py-8 text-center">
                  <ShieldCheck className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No custom roles
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first custom role.
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={roleColumns}
                  data={customRoles}
                  keyExtractor={(item) => item.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Permissions</CardTitle>
              <Button onClick={() => setIsAddPermissionOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Permission
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingPermissions ? (
                <div className="py-8 text-center">Loading permissions...</div>
              ) : permissions.length === 0 ? (
                <div className="py-8 text-center">
                  <Lock className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No permissions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first permission.
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={permissionColumns}
                  data={permissions}
                  keyExtractor={(item) => item.id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-roles">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                These are the default system roles that cannot be modified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldAlert className="h-5 w-5 mr-1.5 text-purple-600" />
                    Super Admin
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Assigned to the first account created during setup. Has unrestricted access to all system features.
                  </p>
                  <div className="bg-purple-50 rounded p-2 text-sm text-purple-800">
                    This role has all permissions automatically.
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-1.5 text-blue-600" />
                    Admin
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Can manage the application, including users, classes, and settings.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Manage users and staff</li>
                    <li>Manage classes and events</li>
                    <li>Access reports</li>
                    <li>Configure system settings</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-1.5 text-green-600" />
                    Teacher
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Responsible for teaching and educating children.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Manage assigned classes</li>
                    <li>Check in/out children</li>
                    <li>Create and manage events</li>
                    <li>View limited reports</li>
                  </ul>
                  <div className="bg-gray-50 rounded p-2 mt-2 text-sm">
                    Can be designated as <span className="font-medium">Volunteer</span> or <span className="font-medium">Paid Staff</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-1.5 text-teal-600" />
                    Teacher Assistant
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Assists teachers in managing classes and children.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Assist with classes</li>
                    <li>Check in/out children</li>
                    <li>Limited management capabilities</li>
                  </ul>
                  <div className="bg-gray-50 rounded p-2 mt-2 text-sm">
                    Can be designated as <span className="font-medium">Volunteer</span> or <span className="font-medium">Paid Staff</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-1.5 text-orange-600" />
                    Parent
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Auto-assigned when parents register an account. Can manage their children's information.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Manage their children's profiles</li>
                    <li>View their children's attendance</li>
                    <li>Register for events</li>
                    <li>View child-specific reports</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2 flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-1.5 text-gray-600" />
                    Staff
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    General staff members with limited administrative access.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>View information</li>
                    <li>Check in/out children</li>
                    <li>Limited management capabilities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new custom role in the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(handleAddRole)} className="space-y-4">
              <FormField
                control={roleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Event Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={roleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the role's purpose" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddRoleOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Role</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>
              Create a new permission that can be assigned to roles.
            </DialogDescription>
          </DialogHeader>
          <Form {...permissionForm}>
            <form onSubmit={permissionForm.handleSubmit(handleAddPermission)} className="space-y-4">
              <FormField
                control={permissionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permission Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Create Event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={permissionForm.control}
                  name="resource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. events" {...field} />
                      </FormControl>
                      <FormDescription>
                        The entity this permission affects
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={permissionForm.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g. create" {...field} />
                      </FormControl>
                      <FormDescription>
                        Like read, create, update, delete
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={permissionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe what this permission allows" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPermissionOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Permission</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedRole && (
        <Dialog open={isAssignPermissionsOpen} onOpenChange={setIsAssignPermissionsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Permissions to {selectedRole.name}</DialogTitle>
              <DialogDescription>
                Select the permissions to assign to this role.
              </DialogDescription>
            </DialogHeader>
            <Form {...assignPermissionsForm}>
              <form onSubmit={assignPermissionsForm.handleSubmit(handleAssignPermissions)} className="space-y-4">
                <FormField
                  control={assignPermissionsForm.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Available Permissions</h3>
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-500">No permissions available.</p>
                  ) : (
                    <div className="space-y-2">
                      {permissions.map(permission => {
                        const currentPermissions = assignPermissionsForm.getValues("permissions") || [];
                        const isChecked = currentPermissions.includes(permission.id);
                        
                        return (
                          <div key={permission.id} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={isChecked}
                              onCheckedChange={() => handlePermissionCheckboxChange(permission.id)}
                            />
                            <div>
                              <label 
                                htmlFor={`permission-${permission.id}`} 
                                className="font-medium text-sm cursor-pointer"
                              >
                                {permission.name}
                              </label>
                              <p className="text-xs text-gray-500">
                                {permission.resource} - {permission.action}
                                {permission.description && `: ${permission.description}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAssignPermissionsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Permissions</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default RolePermissionsManagement;
