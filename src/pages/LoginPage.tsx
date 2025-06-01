
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, LogIn, UserPlus, Loader2 } from "lucide-react";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";

// Create a schema for login validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { user, userRole, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const isStaffLogin = location.state?.staffLogin || false;
  const { navigateToDashboard } = useDashboardNavigation();
  
  // Initialize form with react-hook-form
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Redirect if already logged in - but prevent infinite loops
  useEffect(() => {
    if (user && userRole && !authLoading && !isLoading && !hasRedirected) {
      console.log("LoginPage: Already logged in as:", userRole);
      setHasRedirected(true);
      setTimeout(() => {
        navigateToDashboard();
      }, 100);
    }
  }, [user, userRole, authLoading, isLoading, hasRedirected, navigateToDashboard]);
  
  const onSubmit = async (values: LoginValues) => {
    try {
      setIsLoading(true);
      
      console.log("LoginPage: Attempting login with:", values.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You are now logged in",
      });

      // Let the auth context handle the redirect
      if (data.user) {
        // Wait for auth state to update then navigate
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLanding = () => {
    navigate("/landing");
  };
  
  const handleParentRegistration = () => {
    navigate("/parent-registration");
  };
  
  // Show loading if auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }
  
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
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            {isStaffLogin ? "Staff Login" : "Log In to Your Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {isStaffLogin 
              ? "Log in with your staff credentials" 
              : "Welcome back! Please enter your details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email" 
                        type="email" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your password" 
                        type="password" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        {!isStaffLogin && (
          <CardFooter className="flex justify-center border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Don't have an account?
              </p>
              <Button 
                variant="outline" 
                onClick={handleParentRegistration}
                className="w-full"
                disabled={isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register as a Parent
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
