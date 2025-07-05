
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "@/types/users";

interface UserTableColumnsProps {
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

export const getUserTableColumns = ({ onEdit, onDelete }: UserTableColumnsProps): ColumnDef<UserProfile>[] => [
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: ({ row }) => row.getValue("firstName") || "N/A",
  },
  {
    accessorKey: "lastName", 
    header: "Last Name",
    cell: ({ row }) => row.getValue("lastName") || "N/A",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const getRoleColor = (role: string) => {
        switch (role) {
          case 'super_admin':
            return 'bg-purple-100 text-purple-800';
          case 'admin':
            return 'bg-red-100 text-red-800';
          case 'staff':
            return 'bg-blue-100 text-blue-800';
          case 'teacher':
            return 'bg-green-100 text-green-800';
          case 'teacher_assistant':
            return 'bg-teal-100 text-teal-800';
          case 'parent':
            return 'bg-amber-100 text-amber-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      return (
        <Badge variant="outline" className={getRoleColor(role)}>
          {role?.replace('_', ' ')}
        </Badge>
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
