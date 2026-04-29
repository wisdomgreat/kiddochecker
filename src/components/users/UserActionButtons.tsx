
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserActionButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex space-x-2">
      <Button onClick={() => navigate('/users')}>
        <Plus className="h-4 w-4 mr-2" />
        Create User
      </Button>
      <Button variant="outline" onClick={() => window.location.reload()}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  );
};

export default UserActionButtons;

