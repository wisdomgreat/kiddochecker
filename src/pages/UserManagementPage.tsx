
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserPlus, Edit2, Trash2, Shield } from "lucide-react";
import { useAllUsers, AllUsersData } from "@/hooks/useAllUsers";
import { useToast } from "@/hooks/use-toast";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";
import AddUserModal from "@/components/admin/AddUserModal";
import { EditUserDialog } from "@/components/users/EditUserDialog";

const UserManagementPage = () => {
  const { data: users = [], isLoading, refetch } = useAllUsers();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AllUsersData | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesTab = activeTab === "all" || user.user_type === activeTab;
    
    return matchesSearch && matchesRole && matchesTab;
  });

  const getUsersByType = (type: 'all' | 'staff' | 'parent' | 'admin' | 'volunteer') => {
    if (type === 'all') return users;
    return users.filter(user => user.user_type === type);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'teacher': return 'bg-green-100 text-green-800 border-green-200';
      case 'teacher_assistant': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'parent': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEditUser = (user: AllUsersData) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user: AllUsersData) => {
    if (!window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    toast({
      title: "Feature Coming Soon",
      description: "User deletion will be implemented with proper safeguards.",
    });
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading all users...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch the user data</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <RoleGuard requireAdminAccess>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage all registered users: staff, parents, and administrators
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold">{getUsersByType('admin').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Staff</p>
                    <p className="text-2xl font-bold">{getUsersByType('staff').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-amber-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Parents</p>
                    <p className="text-2xl font-bold">{getUsersByType('parent').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Volunteers</p>
                    <p className="text-2xl font-bold">{getUsersByType('volunteer').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="teacher_assistant">Teacher Assistant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* User Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Users ({users.length})</TabsTrigger>
              <TabsTrigger value="admin">Admins ({getUsersByType('admin').length})</TabsTrigger>
              <TabsTrigger value="staff">Staff ({getUsersByType('staff').length})</TabsTrigger>
              <TabsTrigger value="parent">Parents ({getUsersByType('parent').length})</TabsTrigger>
              <TabsTrigger value="volunteer">Volunteers ({getUsersByType('volunteer').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                      {searchTerm || roleFilter !== 'all' 
                        ? "No users match your current search criteria." 
                        : "No users have been registered yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold text-lg">
                                {user.first_name?.[0] || '?'}{user.last_name?.[0] || ''}
                              </span>
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {user.first_name} {user.last_name}
                              </CardTitle>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-500">{user.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {user.is_super_admin && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                              <Shield className="h-3 w-3 mr-1" />
                              SUPER ADMIN
                            </Badge>
                          )}
                          {user.is_volunteer && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              VOLUNTEER
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={user.is_active 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'}
                          >
                            {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <AddUserModal 
            open={showAddModal} 
            onOpenChange={setShowAddModal}
            onSuccess={() => {
              setShowAddModal(false);
              refetch();
            }}
          />

          <EditUserDialog
            open={showEditModal}
            onOpenChange={setShowEditModal}
            user={{
                id: selectedUser?.id || '',
                email: selectedUser?.email || '',
                first_name: selectedUser?.first_name || '',
                last_name: selectedUser?.last_name || '',
                phone: selectedUser?.phone || '',
                role: selectedUser?.role || 'parent',
                is_super_admin: selectedUser?.is_super_admin || false,
                ...selectedUser // Spread to catch the expanded fields
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              refetch();
            }}
          />
        </div>
      </RoleGuard>
    </ModernLayout>
  );
};

export default UserManagementPage;
