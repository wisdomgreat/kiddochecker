
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStaffManagement } from "@/hooks/useStaffManagement";
import AddStaffForm from "@/components/staff/AddStaffForm";
import { Pencil, Trash2, UserPlus, Search, Filter } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";

const StaffManagement = () => {
  const { staffMembers, isLoading, deleteStaff, isDeletingStaff } = useStaffManagement();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = 
      staff.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'teacher_assistant': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteStaff = async (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) {
      deleteStaff(userId);
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-2">Manage your organization's staff members</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="teacher_assistant">Teacher Assistant</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <Card key={staff.user_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {staff.first_name} {staff.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{staff.email}</p>
                    {staff.phone && (
                      <p className="text-sm text-gray-500 mt-1">{staff.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteStaff(staff.user_id, `${staff.first_name} ${staff.last_name}`)}
                      disabled={isDeletingStaff}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getRoleBadgeColor(staff.role)}>
                    {staff.role.replace('_', ' ')}
                  </Badge>
                  {staff.is_volunteer && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Volunteer
                    </Badge>
                  )}
                  {staff.is_super_admin && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      Super Admin
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={staff.is_active ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}
                  >
                    {staff.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No staff members found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        <AddStaffForm 
          open={showAddForm} 
          onOpenChange={setShowAddForm}
          onSuccess={() => setShowAddForm(false)}
        />
      </div>
    </SimpleLayout>
  );
};

export default StaffManagement;
