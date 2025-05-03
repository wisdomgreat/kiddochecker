
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Filter, Download, UserPlus } from "lucide-react";

const UserActionButtons = () => {
  const { toast } = useToast();

  const handleAddUserClick = () => {
    toast({ 
      title: "Feature coming soon", 
      description: "User creation functionality will be available soon" 
    });
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm">
        <Filter className="mr-1 h-4 w-4" />
        Filter
      </Button>
      <Button variant="outline" size="sm">
        <Download className="mr-1 h-4 w-4" />
        Export
      </Button>
      <Button onClick={handleAddUserClick}>
        <UserPlus className="mr-1 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
};

export default UserActionButtons;
