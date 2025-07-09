
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  UserPlus,
  Search,
  CheckCircle,
  X,
  RefreshCcw,
  Filter,
  Download,
  User,
  Mail,
  Phone,
  Shield,
  Users,
} from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
  phone?: string;
}

const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async (): Promise<UserWithRole[]> => {
      console.log("Fetching users with roles...");
      
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      console.log("Users data received:", data);
      return (data || []) as UserWithRole[];
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const filteredUsers = users.filter((user) => {
    const searchMatch =
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return searchMatch;
    if (activeTab === "admin") return (user.role === "admin" || user.role === "super_admin") && searchMatch;
    if (activeTab === "staff") return (user.role === "staff" || user.role === "teacher" || user.role === "teacher_assistant") && searchMatch;
    if (activeTab === "parent") return user.role === "parent" && searchMatch;
    return false;
  });

  const userColumns = [
    {
      key: "id" as keyof UserWithRole,
      header: "User",
      render: (value: string, item: UserWithRole) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {item.first_name?.[0] || item.email[0].toUpperCase()}
              {item.last_name?.[0] || ""}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {item.first_name && item.last_name 
                ? `${item.first_name} ${item.last_name}` 
                : item.email}
            </div>
            <div className="text-sm text-gray-500">{item.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role" as keyof UserWithRole,
      header: "Role",
      render: (value: string, item: UserWithRole) => (
        <div className="flex items-center space-x-2">
          <div className={`p-1 rounded-full ${
            value === "admin" || value === "super_admin" ? "bg-red-100" : 
            value === "teacher" || value === "staff" || value === "teacher_assistant" ? "bg-blue-100" : 
            "bg-green-100"
          }`}>
            <User size={12} className={`${
              value === "admin" || value === "super_admin" ? "text-red-600" : 
              value === "teacher" || value === "staff" || value === "teacher_assistant" ? "text-blue-600" : 
              "text-green-600"
            }`} />
          </div>
          <span className="capitalize text-sm">{value.replace('_', ' ')}</span>
          {item.is_super_admin && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
              Super Admin
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "phone" as keyof UserWithRole,
      header: "Contact",
      render: (value: string, item: UserWithRole) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-600">
            <Mail size={12} className="mr-1" />
            <span className="truncate max-w-32">{item.email}</span>
          </div>
          {value && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone size={12} className="mr-1" />
              {value}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "is_active" as keyof UserWithRole,
      header: "Status",
      render: (value: boolean) => (
        <div className="flex items-center">
          {value ? (
            <>
              <CheckCircle size={16} className="text-green-500 mr-2" />
              <span className="text-green-700 text-sm font-medium">Active</span>
            </>
          ) : (
            <>
              <X size={16} className="text-gray-400 mr-2" />
              <span className="text-gray-500 text-sm">Inactive</span>
            </>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-600">Error Loading Users</h3>
            <p className="text-sm text-gray-500 mt-2">{error.message}</p>
            <Button 
              onClick={() => refetch()}
              className="mt-4"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Manage all users and their roles in your organization</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-1 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => ['staff', 'teacher', 'teacher_assistant'].includes(u.role)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Parents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'parent').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl">All Users</CardTitle>
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
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="admin">Admins</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="parent">Parents</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2">
                  <RefreshCcw className="animate-spin h-6 w-6 text-blue-600" />
                  <span className="text-gray-600">Loading users...</span>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
                <p className="mt-2 text-gray-600">
                  {searchTerm 
                    ? "No users match your search criteria." 
                    : "No users have been registered yet."}
                </p>
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
      </div>
    </DashboardLayout>
  );
};

export default UsersManagement;
