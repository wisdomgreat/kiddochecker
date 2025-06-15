
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

const ParentRegistration = () => {
  const navigate = useNavigate();
  
  const handleBackToLanding = () => {
    navigate("/landing");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 left-4">
        <Button 
          variant="ghost" 
          onClick={handleBackToLanding} 
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            <UserPlus className="mx-auto h-8 w-8 mb-2" />
            Parent Registration
          </CardTitle>
          <CardDescription className="text-center">
            Create your account to manage your children's attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentRegistration;
