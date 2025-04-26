
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Filter, 
  Download,
  Plus,
  User,
  Mail,
  Phone,
  UserPlus,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import StatCard from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/hooks/use-navigation";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastActive: string;
  joinDate: string;
  children: number;
}

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigation = useNavigation();

  // Fetch real user data from Supabase
  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ["users-management"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        // First, get the list of user IDs and roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (rolesError) throw rolesError;
        
        // Get user data from auth.users table via profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, phone');
          
        if (profilesError) throw profilesError;
        
        // Get user login information
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError || !userData?.users) {
          // Fallback to getting minimal data if admin access is not available
          console.warn("Cannot access user data via admin API. Using limited data set.");
          
          // Count children for parent users
          const { data: parentChildData, error: parentChildError } = await supabase
            .from('parent_children')
            .select('parent_id, child_id');

          if (parentChildError) throw parentChildError;
          
          // Map the parent-child relationships
          const childrenCount: Record<string, number> = {};
          
          if (parentChildData) {
            parentChildData.forEach(relation => {
              if (!childrenCount[relation.parent_id]) {
                childrenCount[relation.parent_id] = 0;
              }
              childrenCount[relation.parent_id]++;
            });
          }
          
          // Combine data from profiles and user_roles
          const result: UserData[] = userRoles.map((roleRecord: any) => {
            const profile = profilesData.find((p: any) => p.id === roleRecord.user_id) || {
              first_name: '',
              last_name: '',
              phone: ''
            };
            
            return {
              id: roleRecord.user_id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User',
              email: '',  // We don't have access to emails without admin API
              phone: profile.phone || '',
              role: roleRecord.role,
              status: 'Active',  // Assume active since we can't check
              lastActive: 'Unknown',
              joinDate: 'Unknown',
              children: childrenCount[roleRecord.user_id] || 0
            };
          });
          
          return result;
        }
        
        // If we have admin access, we can combine all data
        // Count children for parent users
        const { data: parentChildData, error: parentChildError } = await supabase
          .from('parent_children')
          .select('parent_id, child_id');

        if (parentChildError) throw parentChildError;
        
        // Map the parent-child relationships
        const childrenCount: Record<string, number> = {};
        
        if (parentChildData) {
          parentChildData.forEach(relation => {
            if (!childrenCount[relation.parent_id]) {
              childrenCount[relation.parent_id] = 0;
            }
            childrenCount[relation.parent_id]++;
          });
        }
        
        // Format the user data by combining from multiple sources
        const result: UserData[] = userRoles.map((roleRecord: any) => {
          const profile = profilesData.find((p: any) => p.id === roleRecord.user_id) || {
            first_name: '',
            last_name: '',
            phone: ''
          };
          
          const authUser = userData?.users?.find((u: any) => u.id === roleRecord.user_id);
          
          return {
            id: roleRecord.user_id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User',
            email: authUser?.email || '',
            phone: profile.phone || '',
            role: roleRecord.role,
            status: authUser?.email_confirmed_at ? 'Active' : 'Pending',
            lastActive: authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString() : 'Never',
            joinDate: authUser?.created_at ? new Date(authUser.created_at).toLocaleDateString() : 'Unknown',
            children: childrenCount[roleRecord.user_id] || 0
          };
        });
        
        return result;
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user, // Only run query when user is authenticated
  });

  // Stats for the dashboard
  const userStats = {
    total: usersData.length,
    parents: usersData.filter(u => u.role === 'parent').length,
    staff: usersData.filter(u => ['teacher', 'teacher_assistant', 'staff'].includes(u.role)).length,
    admins: usersData.filter(u => ['admin', 'super_admin'].includes(u.role)).length,
  };

  // Filter users based on active tab and search term
  const filteredUsers = usersData.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "admin" && ['admin', 'super_admin'].includes(user.role)) ||
      (activeTab === "teachers" && ['teacher', 'teacher_assistant'].includes(user.role)) ||
      (activeTab === "parents" && user.role === "parent") ||
      (activeTab === "pending" && user.status === "Pending");
    
    return matchesSearch && matchesTab;
  });
  
  // Table columns configuration
  const userColumns = [
    {
      key: "name" as const,
      header: "Name",
      render: (value: string, item: UserData) => (
        <div className="flex items-center">
          <div className="rounded-full bg-gray-100 p-2 mr-3">
            <User size={16} className="text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{item.email}</div>
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
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            ['admin', 'super_admin'].includes(value) ? "bg-purple-100 text-purple-800" : 
            ['teacher', 'teacher_assistant'].includes(value) ? "bg-blue-100 text-blue-800" : 
            value === "parent" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {value}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            value === "Active" ? "bg-green-100 text-green-800" : 
            value === "Inactive" ? "bg-gray-100 text-gray-800" : 
            "bg-yellow-100 text-yellow-800"
          }`}>
            {value}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "lastActive" as const,
      header: "Last Active",
      sortable: true,
    },
    {
      key: "children" as const,
      header: "Children",
      render: (value: number) => (
        <div className="flex items-center">
          {value > 0 ? (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {value} {value === 1 ? 'child' : 'children'}
            </span>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Home", path: "/" },
          { label: "Users", path: "/users" },
          { label: "Management" },
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="text-gray-600 flex items-center gap-1">
            <Filter size={16} />
            <span>Filter</span>
          </Button>
          <Button variant="outline" className="text-gray-600 flex items-center gap-1">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <Button className="bg-purple-600 text-white flex items-center gap-1">
            <UserPlus size={16} />
            <span>Add New User</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="TOTAL USERS"
          value={userStats.total.toString()}
          description="Active accounts"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="PARENTS"
          value={userStats.parents.toString()}
          description="Family accounts"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="STAFF"
          value={userStats.staff.toString()}
          description="Staff members"
          icon={<Users size={24} />}
          className="bg-white"
        />
        
        <StatCard
          title="ADMINS"
          value={userStats.admins.toString()}
          description="System administrators"
          icon={<Users size={24} />}
          className="bg-white"
        />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fade-in">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "all"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Users
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "admin"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("admin")}
          >
            Admins
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "teachers"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("teachers")}
          >
            Teachers
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "parents"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("parents")}
          >
            Parents
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === "pending"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or role"
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            keyExtractor={(item: UserData) => item.id}
            searchable={false}
            loading={isLoading}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default UsersManagement;
