
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building, ArrowLeft, AlertCircle } from "lucide-react";
import { OrganizationWizard } from "@/components/organization/OrganizationWizard";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [checkingOrganization, setCheckingOrganization] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if organization exists
  useEffect(() => {
    const checkOrganizationExists = async () => {
      try {
        setConnectionError(false);
        console.log("Checking if organization exists...");
        
        const { data, error } = await supabase
          .from('organization_settings')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Error checking organization:', error);
          if (error.message.includes('fetch') || error.message.includes('network')) {
            setConnectionError(true);
            return;
          }
        } else {
          setHasOrganization(data && data.length > 0);
          console.log("Organization check completed:", data && data.length > 0);
        }
      } catch (error) {
        console.error('Exception checking organization:', error);
        setConnectionError(true);
      } finally {
        setCheckingOrganization(false);
      }
    };

    checkOrganizationExists();
  }, []);

  const onSubmit = async (values: LoginValues) => {
    try {
      setIsLoading(true);
      setConnectionError(false);
      
      console.log("Attempting to sign in user...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Login error:", error);
        
        // Handle specific error types
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setConnectionError(true);
          toast({
            title: "Connection Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (!data.user) {
        throw new Error("Login failed - no user data returned");
      }

      console.log("Login successful for user:", data.user.id);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your email and password and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSetupComplete = () => {
    setShowOrgSetup(false);
    setHasOrganization(true);
    toast({
      title: "Organization Setup Complete",
      description: "Your organization has been successfully created!",
    });
  };

  const retryConnection = () => {
    setCheckingOrganization(true);
    setConnectionError(false);
    // Re-trigger the organization check
    window.location.reload();
  };

  if (showOrgSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowOrgSetup(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>
        <OrganizationWizard onComplete={handleOrgSetupComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 left-4">
        <Link to="/landing">
          <Button 
            variant="ghost" 
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {connectionError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Connection failed. Please check your internet connection.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryConnection}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

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
                        disabled={isLoading || connectionError}
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
                        disabled={isLoading || connectionError}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || connectionError}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Only show organization setup button if no organization exists */}
          {!checkingOrganization && !hasOrganization && !connectionError && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowOrgSetup(true)}
            >
              <Building className="mr-2 h-4 w-4" />
              Set Up New Organization
            </Button>
          )}

          {checkingOrganization && !connectionError && (
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/parent-registration" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
