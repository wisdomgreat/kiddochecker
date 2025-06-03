
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
  const { user, userRole } = useAuth();

  const redirectBasedOnRole = (role: string) => {
    console.log("LoginForm: Redirecting based on role:", role);
    if (role === 'admin' || role === 'super_admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (role === 'teacher' || role === 'teacher_assistant' || role === 'staff') {
      navigate('/teacher-dashboard', { replace: true });
    } else if (role === 'parent') {
      navigate('/parent-dashboard', { replace: true });
    } else {
      navigate('/landing', { replace: true });
    }
  };

  // Only redirect if already logged in and not in loading state
  useEffect(() => {
    if (user && userRole && !loading) {
      console.log("LoginForm: User already logged in with role:", userRole);
      
      // Check if we're not already on the correct dashboard
      const currentPath = location.pathname;
      if (userRole === 'admin' || userRole === 'super_admin') {
        if (currentPath !== '/admin-dashboard') {
          redirectBasedOnRole(userRole);
        }
      } else if (userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff') {
        if (currentPath !== '/teacher-dashboard') {
          redirectBasedOnRole(userRole);
        }
      } else if (userRole === 'parent') {
        if (currentPath !== '/parent-dashboard') {
          redirectBasedOnRole(userRole);
        }
      }
    }
  }, [user, userRole, loading, location.pathname]);

  const handleContinue = async () => {
    try {
      setLoading(true);
      // Validate inputs
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error("Please enter a valid phone number");
      }
      if (!pin || pin.length < 6) {
        throw new Error("Please enter a PIN or password of at least 6 characters");
      }
      
      // In a real app with phone auth, this would use phone authentication
      // For demo, we're using email+password with a fake email derived from phone
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const fakeEmail = `${cleanedPhone}@example.com`;
      
      console.log("LoginForm: Attempting login with:", fakeEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: pin,
      });

      if (error) throw error;

      toast({
        title: "Login Successful",
        description: "You have been logged in successfully",
      });
      
      // Get the return path from session storage
      const returnPath = sessionStorage.getItem("returnPath");
      console.log("LoginForm: Return path from session:", returnPath);
      
      // Handle redirects after successful login
      if (data.user) {
        if (returnPath && returnPath !== "/login" && returnPath !== "/check-in-process") {
          sessionStorage.removeItem("returnPath");
          navigate(returnPath, { replace: true });
        } else {
          // Wait for auth context to update with role before redirecting
          setTimeout(() => {
            window.location.reload(); // Force a refresh to ensure auth state is properly updated
          }, 100);
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message,
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
