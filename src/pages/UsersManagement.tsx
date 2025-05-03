
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { RefreshCcw } from "lucide-react";
import { getUserTableColumns } from "@/components/users/UserTableColumns";
import UserFilters from "@/components/users/UserFilters";
import UserActionButtons from "@/components/users/UserActionButtons";
import EmptyUserState from "@/components/users/EmptyUserState";
import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import useUserRoles from "@/hooks/useUserRoles";
import { UserProfile } from "@/types/users";

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Use the custom hook to fetch users data
  const { data: users = [], isLoading } = useUserRoles();

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

  // Generate the user table columns
  const userColumns = getUserTableColumns({
    onEdit: handleEditUser,
    onDelete: handleDeleteConfirmation
  });

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <UserActionButtons />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <UserFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <EmptyUserState searchTerm={searchTerm} />
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

      <DeleteUserDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedUser={selectedUser}
        onDelete={handleDeleteUser}
      />
    </MainLayout>
  );
};

export default UsersManagement;
