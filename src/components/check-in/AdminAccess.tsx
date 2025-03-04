
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const AdminAccess = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center">
      <p className="text-gray-400 mb-2">Admin Access</p>
      <Button variant="outline" className="bg-white" onClick={() => navigate("/settings")}>
        Staff Login
      </Button>
    </div>
  );
};

export default AdminAccess;
