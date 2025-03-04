
import React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RegistrationPromptProps {
  onSignUp: () => void;
}

export const RegistrationPrompt = ({ onSignUp }: RegistrationPromptProps) => {
  return (
    <Card className="bg-white rounded-lg p-6 shadow-md">
      <div className="text-center space-y-3">
        <h3 className="text-lg font-medium text-gray-900">New to ChurchCheck?</h3>
        <p className="text-gray-600">Register your family for easy check-in and check-out.</p>
        <Button 
          onClick={onSignUp} 
          className="w-full"
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Register Here
        </Button>
      </div>
    </Card>
  );
};

export default RegistrationPrompt;
