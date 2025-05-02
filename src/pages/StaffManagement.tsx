import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddStaffForm from "@/components/staff/AddStaffForm";
import EditStaffForm from "@/components/staff/EditStaffForm";
import { StaffMember, AppRole } from "@/types/supabase";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/hooks/use-navigation";

const StaffManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        
        const { data, error } = await supabase.rpc('get_staff_members');

        if (error) {
          console.error("Error using get_staff_members RPC:", error);
          throw error;
        }

        return data ? data.map((staff: any): StaffMember => ({
          id: staff.user_id,
          user_id: staff.user_id,
          email: staff.email || '',
          first_name: staff.first_name || '',
          last_name: staff.last_name || '',
          role: staff.role as AppRole || 'teacher',
          phone: staff.phone || '',
          is_active: staff.is_active || false,
          is_super_admin: staff.is_super_admin || false,
          is_volunteer: staff.is_volunteer || false,
          created_at: new Date().toISOString(),
        })) : [];
      } catch (error: any) {
        console.error("Error fetching staff members:", error);
        toast({
          title: "Error",
          description: "Failed to load staff members: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  const filteredStaffMembers = staffMembers.filter((member) => {
    const searchMatch =
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return searchMatch;
    if (activeTab === "admin") return member.role === "admin" && searchMatch;
    if (activeTab === "teacher") return member.role === "teacher" && searchMatch;
    return false;
  });

  const handleEditStaffMember = (member: StaffMember) => {
    setSelectedStaffMember(member);
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
              {item.first_name?.[0] || ""}{item.last_name?.[0] || ""}
            </span>
          </div>
          <div>
            <div className="font-medium">{item.first_name} {item.last_name}</div>
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
          <div className={`p-1 rounded-full mr-2 ${
            value === "admin" ? "bg-purple-100" : 
            value === "teacher" ? "bg-blue-100" : "bg-green-100"
          }`}>
            <User size={16} className={`${
              value === "admin" ? "text-purple-600" : 
              value === "teacher" ? "text-blue-600" : "text-green-600"
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
      render: (value: any, item: StaffMember) => (
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
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" />
            Add Staff Member
          </Button>
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
          ) : staffMembers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
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
              loading={isLoadingStaff}
            />
          )}
        </CardContent>
      </Card>

      <AddStaffForm 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["staff-members"] })}
      />

      {selectedStaffMember && (
        <EditStaffForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          staffMember={selectedStaffMember}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["staff-members"] });
            setSelectedStaffMember(null);
          }}
        />
      )}
    </MainLayout>
  );
};

export default StaffManagement;
