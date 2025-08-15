
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserWithRole {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
}

const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserWithRole[]> => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      return (data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'parent',
        is_super_admin: user.is_super_admin || false,
        is_active: user.is_active || false
      }));
    }
  });

  const filteredUsers = users.filter(user => 
    searchTerm === '' || 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-green-100 text-green-800";
      case "teacher_assistant":
        return "bg-teal-100 text-teal-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      case "parent":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                    {user.is_super_admin && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800">
                        Super Admin
                      </Badge>
                    )}
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
