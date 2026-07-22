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
      <div className="w-full max-w-md space-y-6">
        <div className="bg-card border border-border/70 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">KiddoChecker</span>
          </div>

          {!isSent ? (
            <>
              <div className="space-y-1.5 mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your registered email address to receive password recovery instructions.
                </p>
              </div>

              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 rounded-xl text-xs"
                      placeholder="name@organization.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Send Recovery Link
                </Button>

                <Link 
                  to="/login"
                  className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary text-xs font-semibold tracking-wider uppercase transition-colors pt-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </Link>
              </form>
            </>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Check your Email</h2>
                <p className="text-xs text-muted-foreground">
                  We've dispatched password reset instructions to <strong className="text-foreground">{email}</strong>.
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider mt-4"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-center text-muted-foreground text-[10px] uppercase tracking-widest font-semibold">
          Encrypted Authentication System
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
