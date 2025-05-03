
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit, Trash2, Check, X, Mail, Phone, CalendarClock } from "lucide-react";
import { UserProfile } from "@/types/users";

interface UserTableColumnsProps {
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

export const getUserTableColumns = ({ onEdit, onDelete }: UserTableColumnsProps) => [
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
          onClick={() => onEdit(userItem)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDelete(userItem)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ),
  },
];

export default getUserTableColumns;
