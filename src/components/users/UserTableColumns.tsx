
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Shield } from "lucide-react";
import { UserProfile } from "@/types/users";

interface UserTableColumnsProps {
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
  onAssignRole?: (user: UserProfile) => void;
}

export const getUserTableColumns = ({ 
  onEdit, 
  onDelete, 
  onAssignRole 
}: UserTableColumnsProps): ColumnDef<UserProfile>[] => [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const user = row.original;
      
      const getRoleColor = (role: string) => {
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getRoleColor(role)}>
            {role?.replace('_', ' ')}
          </Badge>
          {user.isSuperAdmin && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string;
      return new Date(date).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            {onAssignRole && (
              <DropdownMenuItem onClick={() => onAssignRole(user)}>
                <Shield className="mr-2 h-4 w-4" />
                Assign Role
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

