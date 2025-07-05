
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserProfile } from "@/types/users";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  user: UserProfile | null;
  selectedUser: UserProfile | null;
  onDelete: () => void;
}

const DeleteUserDialog = ({ 
  isOpen, 
  onClose, 
  onOpenChange, 
  onConfirm, 
  onDelete,
  user, 
  selectedUser 
}: DeleteUserDialogProps) => {
  const currentUser = user || selectedUser;
  
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onDelete) onDelete();
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    if (!open && onClose) onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {currentUser?.firstName} {currentUser?.lastName}'s account.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
