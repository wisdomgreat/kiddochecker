
import { useState } from "react";
import { User, Phone, Lock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CheckInKiosk = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const handleContinue = () => {
    // In a real application, this would verify the credentials
    console.log("Credentials submitted:", { phoneNumber, pin });
    toast({
      title: "Login Successful",
      description: "You have been logged in successfully",
      variant: "default",
    });
    // In a real app, this would navigate to the next step or parent dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Welcome to ChurchCheck</h1>
        <p className="text-gray-600">Please enter your phone number to check in your children</p>
      </div>
      
      <Card className="w-full max-w-2xl bg-slate-50/90 border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-semibold">Parent Login</h2>
              <p className="text-sm text-gray-500">Enter your credentials to continue</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pr-10 bg-white text-base py-6"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-base font-medium">PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pr-10 bg-white text-base py-6"
                  maxLength={4}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleContinue}
              className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700"
              disabled={!phoneNumber || !pin}
            >
              Continue
            </Button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-500 flex items-center justify-center gap-1">
              <HelpCircle className="h-4 w-4" />
              Need help? Ask a staff member for assistance
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="w-full max-w-2xl mt-6">
        <div className="bg-slate-50/80 rounded-lg p-4 text-center">
          <a href="#" className="text-blue-500 hover:text-blue-600">
            New Parent? Register Here
          </a>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-2">Admin Access</p>
          <Button variant="outline" className="bg-white">
            Staff Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckInKiosk;
