import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const isAzure = !!import.meta.env.VITE_API_URL;

      if (isAzure) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        
        if (!res.ok) {
          const text = await res.text();
          let errorMsg = 'Request failed';
          try {
            const data = JSON.parse(text);
            errorMsg = data.error || data.detail || errorMsg;
          } catch {
            // Server returned HTML (likely a 500 or container crash) — show a friendly message
            console.error('[ForgotPassword] Non-JSON error response:', text.slice(0, 200));
            errorMsg = 'Server error – please try again in a moment.';
          }
          throw new Error(errorMsg);
        }
        
        setIsSent(true);
        toast({
          title: "Request Processed",
          description: "If an account exists, you will receive a reset link shortly."
        });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast({
            title: "Request Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setIsSent(true);
          toast({
            title: "Email Sent",
            description: "Check your inbox for password reset instructions."
          });
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/10 rounded border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">KiddoChecker</span>
          </div>

          {!isSent ? (
            <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email address to receive a reset link.
                </p>
              </div>

              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      placeholder="name@organization.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Send Reset Link
                </Button>

                <Link 
                  to="/login"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-sm transition-colors pt-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your Email</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We've sent a password reset link to <span className="text-foreground font-bold">{email}</span>.
              </p>
              
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-center text-muted-foreground text-[10px] uppercase tracking-widest">
          Secure identity management powered by KiddoChecker Auth
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

