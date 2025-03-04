
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export const AdminAccess = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center mt-8 border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-500 mb-2">Staff and Administrator Access</p>
      <Button 
        variant="outline" 
        className="bg-white text-gray-700 border-gray-300" 
        onClick={() => navigate("/settings")}
      >
        <Shield className="mr-2 h-4 w-4 text-purple-500" />
        Staff Login
      </Button>
    </div>
  );
};

export default AdminAccess;
