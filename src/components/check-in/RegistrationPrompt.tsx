
import React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RegistrationPromptProps {
  onSignUp: () => void;
}

export const RegistrationPrompt = ({ onSignUp }: RegistrationPromptProps) => {
  return (
    <div className="bg-slate-50/80 rounded-lg p-4 text-center">
      <Button 
        variant="ghost" 
        onClick={onSignUp} 
        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium"
      >
        <UserPlus className="mr-2 h-5 w-5" />
        New Parent? Register Here
      </Button>
    </div>
  );
};

export default RegistrationPrompt;
