import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Mail, Lock, Shield, QrCode, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EnhancedLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      console.log('User detected, redirecting from login page');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        // Navigation will be handled by useEffect above
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          }
        }
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        setMode('login');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Informational Hero Section (Left on desktop, Top on mobile) */}
      <div className="md:w-1/2 lg:w-3/5 bg-indigo-600 text-white flex flex-col justify-center px-8 py-12 md:p-16 lg:p-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-3xl" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">KiddoChecker</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Secure, Modern<br />Child Check-in System
          </h2>
          
          <p className="text-lg md:text-xl text-indigo-100 mb-10 leading-relaxed font-medium">
            Streamline your organization's child safety protocols with our advanced attendance tracking, staff verification, and digital check-in/out platform.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <QrCode className="h-5 w-5 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Instant QR Check-ins</h3>
                <p className="text-indigo-100/80">Lightning-fast contactless drop-offs and pick-ups using secure digital QR codes and Kiosks.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <ShieldCheck className="h-5 w-5 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Staff Verification</h3>
                <p className="text-indigo-100/80">Ensure safety with automated background check tracking and certification management.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <Activity className="h-5 w-5 text-indigo-100" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Real-time Monitoring</h3>
                <p className="text-indigo-100/80">Live dashboards, instant parent notifications, and comprehensive attendance reporting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Section (Right on desktop, Bottom on mobile) */}
      <div className="md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please sign in to your KiddoChecker dashboard
            </p>
          </div>

        <Card className="w-full">
          <CardHeader>
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs value={mode}>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="text-left">
                      <Label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email address
                      </Label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <Label htmlFor="password" className="block text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-left">
                        <Label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1"
                          placeholder="First name"
                        />
                      </div>
                      <div className="text-left">
                        <Label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <Label htmlFor="signup-email" className="block text-sm font-medium text-foreground">
                        Email address
                      </Label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <Label htmlFor="signup-password" className="block text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-left">
                      <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                        Confirm Password
                      </Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;