
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CompleteStep = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-green-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold">Registration Complete!</h2>
      <p className="text-gray-600">
        Thank you for registering with our children's ministry check-in system.
        You can now use the check-in kiosk with your phone number and PIN.
      </p>
      
      <div className="pt-4">
        <Button 
          onClick={() => navigate("/parent-dashboard")}
          className="w-full md:w-auto"
        >
          Go to Parent Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CompleteStep;

