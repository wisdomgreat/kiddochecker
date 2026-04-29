
import { Users } from "lucide-react";

interface EmptyUserStateProps {
  searchTerm: string;
}

const EmptyUserState = ({ searchTerm }: EmptyUserStateProps) => {
  return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? "No users found" : "No users yet"}
      </h3>
      <p className="text-gray-500">
        {searchTerm 
          ? "Try adjusting your search criteria"
          : "Get started by creating your first user"
        }
      </p>
    </div>
  );
};

export default EmptyUserState;

