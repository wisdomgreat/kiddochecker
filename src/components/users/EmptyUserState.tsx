
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmptyUserStateProps {
  searchTerm: string;
}

const EmptyUserState = ({ searchTerm }: EmptyUserStateProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddUserClick = () => {
    setIsAddDialogOpen(true);
  };

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
        <Button onClick={handleAddUserClick}>
          <UserPlus className="mr-1 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>User creation functionality will be available soon. This feature is currently being implemented.</p>
            <p>In the meantime, you can add users directly through the Supabase dashboard.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmptyUserState;
