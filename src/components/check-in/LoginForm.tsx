
import React, { useState, useEffect } from "react";
import { HelpCircle, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneNumberForm from "./PhoneNumberForm";
import PinEntryForm from "./PinEntryForm";
import { useAuth } from "@/context/AuthContext";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

interface LoginFormProps {
  onSignUp: () => void;
}

export const LoginForm = ({ onSignUp }: LoginFormProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, loading: authLoading } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();

  useEffect(() => {
    if (user && userRole && !authLoading && !loading) {
      const currentPath = location.pathname;
      const isDashboardPath = currentPath.includes('dashboard') || currentPath === '/';
      
      if (!isDashboardPath || currentPath === '/login') {
        navigateToDashboard();
      }
    }
  }, [user, userRole, authLoading, loading, location.pathname, navigateToDashboard]);

  const handleContinue = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!pin || pin.length < 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a PIN of at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Convert phone to email format for authentication
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const fakeEmail = `${cleanedPhone}@phone.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: pin,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Authentication failed");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid phone number or PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <PhoneNumberForm phoneNumber={phoneNumber} onChange={setPhoneNumber} />
          <PinEntryForm pin={pin} onChange={setPin} />
          
          <Button 
            onClick={handleContinue}
            className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-700"
            disabled={!phoneNumber || !pin || loading}
          >
            {loading ? "Please wait..." : (
              <div className="flex items-center justify-center">
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </div>
            )}
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
  );
};

export default LoginForm;
