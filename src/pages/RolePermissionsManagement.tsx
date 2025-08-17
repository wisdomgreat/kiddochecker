import { useState, useEffect } from "react";
import ModernLayout from "@/components/layout/ModernLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  PlusCircle,
  Trash2,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/CleanAuthContext";
import { AppRole } from "@/types/supabase";

const RolePermissionsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<AppRole>('parent');

  // Fetch all users with their roles
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) throw error;
      return data || [];
    },
  });

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role updated successfully",
      });

      setIsAssignRoleOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAssignRole = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'parent');
    setIsAssignRoleOpen(true);
  };

  const userColumns = [
    {
      key: "email" as const,
      header: "Email",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "first_name" as const,
      header: "First Name",
      render: (value: string) => value || "-",
    },
    {
      key: "last_name" as const,
      header: "Last Name", 
      render: (value: string) => value || "-",
    },
    {
      key: "role" as const,
      header: "Role",
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "super_admin" ? "bg-purple-100 text-purple-800" :
          value === "admin" ? "bg-blue-100 text-blue-800" :
          value === "staff" ? "bg-green-100 text-green-800" :
          value === "teacher" ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {value?.replace('_', ' ').toUpperCase() || 'PARENT'}
        </span>
      ),
    },
    {
      key: "is_super_admin" as const,
      header: "Super Admin",
      render: (value: boolean) => value ? "✓" : "-",
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAssignRole(item)}
          disabled={userRole !== 'admin' && userRole !== 'super_admin'}
        >
          <Shield className="h-4 w-4 mr-1" />
          Assign Role
        </Button>
      ),
    },
  ];

  if (userRole !== "admin" && userRole !== "super_admin") {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to access role management.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Role & Permission Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and system permissions
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Roles
            </TabsTrigger>
            <TabsTrigger value="system-roles">
              <Lock className="h-4 w-4 mr-2" />
              System Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="py-8 text-center">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground">
                      Users will appear here once they register.
                    </p>
                  </div>
                ) : (
                  <DataTable
                    columns={userColumns}
                    data={users}
                    keyExtractor={(item) => item.id}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-roles">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Role Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Super Admin</h3>
                        <p className="text-sm text-muted-foreground">
                          Full system access, can manage all users and settings
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        HIGHEST
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Admin</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage users, classes, and organizational settings
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        HIGH
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Staff</h3>
                        <p className="text-sm text-muted-foreground">
                          Check-in/out children, manage attendance
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        MEDIUM
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Teacher</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage assigned classes and student information
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        MEDIUM
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Parent</h3>
                        <p className="text-sm text-muted-foreground">
                          View and manage own children's information
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        BASIC
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedUser?.email}
                </p>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {userRole === 'super_admin' && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAssignRoleOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAssignRole}>
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
};

export default RolePermissionsManagement;
