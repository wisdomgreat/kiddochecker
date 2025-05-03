
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, UserPlus } from "lucide-react";

interface EmptyUserStateProps {
  searchTerm: string;
}

const EmptyUserState = ({ searchTerm }: EmptyUserStateProps) => {
  const { toast } = useToast();

  return (
    <div className="text-center py-8">
      <User className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm 
          ? "No users match your search criteria." 
          : "Get started by adding your first user."}
      </p>
      <div className="mt-6">
        <Button 
          onClick={() => toast({ 
            title: "Feature coming soon", 
            description: "User creation functionality will be available soon" 
          })}
        >
          <UserPlus className="mr-1 h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
};

export default EmptyUserState;
