
import { User, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EmptyUserStateProps {
  searchTerm?: string;
}

const EmptyUserState = ({ searchTerm }: EmptyUserStateProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAddUserClick = () => {
    // For now, show toast that this feature is coming soon
    toast({
      title: "Feature coming soon",
      description: "User creation functionality is being implemented",
    });
    // When we have a real modal, use this:
    // setIsAddModalOpen(true);
  };

  return (
    <div className="text-center py-10">
      {searchTerm ? (
        <div>
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find any users matching "{searchTerm}".
            <br />
            Try checking for typos or using different keywords.
          </p>
        </div>
      ) : (
        <div>
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No users yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first user.
          </p>
          <div className="mt-6">
            <Button onClick={handleAddUserClick}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyUserState;
