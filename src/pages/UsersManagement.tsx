
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AppRole, UserRoleData } from "@/types/supabase";
import { format } from "date-fns";
import {
  Search,
  Users,
  UserPlus,
  Filter,
  Download,
  RefreshCcw,
  User,
  Mail,
  CalendarClock,
  Edit,
  Trash2,
  Check,
  X,
  Phone
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  roleData?: UserRoleData;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  lastSignIn?: string;
  children?: number;
  name?: string;
  contact?: string;
  activity?: string;
  status?: boolean;
}

interface ProfileData {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  users?: {
    email?: string;
    created_at?: string;
    last_sign_in_at?: string;
  };
  user_roles?: {
    role?: AppRole;
    is_super_admin?: boolean;
  };
}

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            phone,
            users:id (
              email,
              created_at,
              last_sign_in_at
            ),
            user_roles:id (
              role,
              is_super_admin
            )
          `);

        if (error) {
          throw error;
        }
        
        const childrenCounts = await Promise.all(
          data.filter(u => {
            // Enhanced null checking for user_roles
            if (!u) return false;
            
            const userRoles = u.user_roles;
            // First check if userRoles exists
            if (!userRoles) return false;
            
            // Then check if it's an object and has the role property
            if (typeof userRoles !== 'object') return false;
            
            // Now safely check if the role property exists and equals 'parent'
            if (!(userRoles && 'role' in userRoles)) return false;
            
            return userRoles && userRoles.role === 'parent';
          }).map(async (u) => {
            const { count, error } = await supabase
              .from('parent_children')
              .select('*', { count: 'exact' })
              .eq('parent_id', u.id);
              
            return { userId: u.id, count: count || 0 };
          })
        );
        
        return data.map((item): UserProfile => {
          const usersData = item.users && typeof item.users === 'object' ? item.users : {};
          
          // Enhanced null checking for user_roles
          let userRole: AppRole = 'parent'; // Default role
          let isSuperAdmin = false;
          
          // Safe access to user_roles with comprehensive null checks
          if (item.user_roles) {
            const userRoles = item.user_roles;
            
            // Check if it's an object first
            if (userRoles && typeof userRoles === 'object') {
              // Check if the role property exists and is a string
              if (userRoles && 'role' in userRoles && userRoles.role && typeof userRoles.role === 'string') {
                userRole = userRoles.role as AppRole;
              }
              
              // Check if the is_super_admin property exists
              if (userRoles && 'is_super_admin' in userRoles) {
                isSuperAdmin = !!userRoles.is_super_admin;
              }
            }
          }
          
          const childCount = childrenCounts.find(c => c.userId === item.id)?.count || 0;
          
          return {
            id: item.id,
            email: usersData && typeof usersData === 'object' && 'email' in usersData ? usersData.email as string : '',
            firstName: item.first_name || '',
            lastName: item.last_name || '',
            role: userRole,
            roleData: {
              role: userRole,
              is_super_admin: isSuperAdmin
            },
            phone: item.phone || '',
            createdAt: usersData && typeof usersData === 'object' && 'created_at' in usersData ? usersData.created_at as string : '',
            lastSignIn: usersData && typeof usersData === 'object' && 'last_sign_in_at' in usersData ? usersData.last_sign_in_at as string : '',
            isActive: usersData && typeof usersData === 'object' && 'last_sign_in_at' in usersData ? !!usersData.last_sign_in_at : false,
            children: childCount,
          };
        });
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: `Failed to load users: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const filteredUsers = users.filter((userItem) => {
    const searchMatch =
      userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return searchMatch;
    if (activeTab === "parents") return userItem.role === "parent" && searchMatch;
    if (activeTab === "staff") return (userItem.role === "staff" || userItem.role === "teacher" || userItem.role === "teacher_assistant") && searchMatch;
    return false;
  });

  const handleEditUser = (userItem: UserProfile) => {
    toast({
      title: "Edit User",
      description: `Editing ${userItem.firstName} ${userItem.lastName} (Feature coming soon)`,
    });
  };

  const handleDeleteConfirmation = (userItem: UserProfile) => {
    setSelectedUser(userItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (profileError) throw profileError;
      
      const { error: authError } = await supabase.auth.admin.deleteUser(selectedUser.id);
      
      if (authError) throw authError;
      
      toast({
        title: "Success",
        description: `${selectedUser.firstName} ${selectedUser.lastName} has been deleted`,
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      queryClient.invalidateQueries({ queryKey: ["users"] });
      
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const userColumns = [
    {
      key: "name" as keyof UserProfile,
      header: "Name",
      render: (value: string, userItem: UserProfile) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-medium">
              {userItem.firstName?.[0] || ""}{userItem.lastName?.[0] || ""}
            </span>
          </div>
          <div>
            <div className="font-medium">{userItem.firstName} {userItem.lastName}</div>
            <div className="text-xs text-gray-500">{userItem.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role" as keyof UserProfile,
      header: "Role",
      render: (value: string) => {
        let color = "";
        
        switch (value) {
          case "admin":
            color = "bg-purple-100 text-purple-800";
            break;
          case "staff":
            color = "bg-blue-100 text-blue-800";
            break;
          case "teacher":
            color = "bg-green-100 text-green-800";
            break;
          case "teacher_assistant":
            color = "bg-teal-100 text-teal-800";
            break;
          case "parent":
            color = "bg-amber-100 text-amber-800";
            break;
          default:
            color = "bg-gray-100 text-gray-800";
        }
        
        return (
          <Badge variant="outline" className={`${color} capitalize`}>
            {value.replace('_', ' ')}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "children" as keyof UserProfile,
      header: "Children",
      render: (value: number, userItem: UserProfile) => (
        <div className="text-center">
          {userItem.role === "parent" ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {value}
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "contact" as keyof UserProfile,
      header: "Contact Info",
      render: (value: string, userItem: UserProfile) => (
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <Mail size={14} className="mr-1" />
            {userItem.email}
          </div>
          {userItem.phone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone size={14} className="mr-1" />
              {userItem.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "activity" as keyof UserProfile,
      header: "Account Activity",
      render: (value: string, userItem: UserProfile) => (
        <div className="text-xs text-gray-500">
          <div className="flex items-center">
            <CalendarClock size={14} className="mr-1" />
            Joined: {userItem.createdAt ? format(new Date(userItem.createdAt), "MMM d, yyyy") : 'Unknown'}
          </div>
          {userItem.lastSignIn && (
            <div className="mt-1">
              Last sign in: {format(new Date(userItem.lastSignIn), "MMM d, yyyy")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status" as keyof UserProfile,
      header: "Status",
      render: (value: boolean) => (
        <div className="flex items-center">
          {value ? (
            <>
              <Check size={16} className="text-green-500 mr-1" />
              <span>Active</span>
            </>
          ) : (
            <>
              <X size={16} className="text-gray-400 mr-1" />
              <span>Inactive</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, userItem: UserProfile) => (
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEditUser(userItem)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDeleteConfirmation(userItem)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => toast({ title: "Feature coming soon", description: "User creation functionality will be available soon" })}>
            <UserPlus className="mr-1 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage users, assign roles, and monitor activity
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search users..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="parents">Parents</TabsTrigger>
              <TabsTrigger value="staff">Staff & Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "No users match your search criteria." 
                  : "Get started by adding your first user."}
              </p>
              <div className="mt-6">
                <Button onClick={() => toast({ title: "Feature coming soon", description: "User creation functionality will be available soon" })}>
                  <UserPlus className="mr-1 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={userColumns}
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              searchable={false}
              loading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedUser?.firstName} {selectedUser?.lastName}'s account
              and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default UsersManagement;
