
import { useState, useEffect } from "react";
import { User, Phone, Lock, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CheckInKiosk = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session) {
        // If already logged in, redirect to dashboard
        navigate("/parent-dashboard");
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        if (newSession) {
          navigate("/parent-dashboard");
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      // Validate inputs
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error("Please enter a valid phone number");
      }
      if (!pin || pin.length < 4) {
        throw new Error("Please enter a 4-digit PIN");
      }
      
      // In a real application, you would implement phone auth here
      // For now, we'll use email+password with a fake email derived from phone
      const fakeEmail = `${phoneNumber.replace(/\D/g, '')}@example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pin,
        options: {
          data: {
            phone: phoneNumber,
            // We're not collecting names at check-in, but the trigger expects them
            first_name: "New",
            last_name: "Parent",
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: "Please verify your account (in a real app this would be via SMS)",
        variant: "default",
      });
      
      // In a real app with phone auth, we would handle verification here
      // For demo purposes, we'll log them in directly
      await handleContinue();
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      setLoading(true);
      // Validate inputs
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error("Please enter a valid phone number");
      }
      if (!pin || pin.length < 4) {
        throw new Error("Please enter a 4-digit PIN");
      }
      
      // In a real app with phone auth, this would use phone authentication
      // For demo, we're using email+password with a fake email derived from phone
      const fakeEmail = `${phoneNumber.replace(/\D/g, '')}@example.com`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: pin,
      });

      if (error) throw error;

      toast({
        title: "Login Successful",
        description: "You have been logged in successfully",
        variant: "default",
      });
      
      // Navigate to parent dashboard
      navigate("/parent-dashboard");
      
    } catch (error: any) {
      // If login failed, it might be because user doesn't exist
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += '(' + cleaned.substring(0, 3);
      if (cleaned.length > 3) {
        formatted += ') ' + cleaned.substring(3, 6);
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, 10);
        }
      }
    }
    
    return formatted.trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setPhoneNumber(formattedValue);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input for PIN
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setPin(value);
    }
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
                  onChange={handlePhoneChange}
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
                  onChange={handlePinChange}
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
              disabled={!phoneNumber || !pin || loading}
            >
              {loading ? "Please wait..." : "Continue"}
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
          <a href="#" onClick={(e) => {e.preventDefault(); handleSignUp();}} className="text-blue-500 hover:text-blue-600">
            New Parent? Register Here
          </a>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-2">Admin Access</p>
          <Button variant="outline" className="bg-white" onClick={() => navigate("/settings")}>
            Staff Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckInKiosk;
