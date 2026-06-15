import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, Smartphone, ArrowLeft, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { validation } from '@/utils/validation';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mfaLevel, isMfaEnrolled, refreshMfaStatus, loading, session } = useAuth();

  // Ensure we have a recovery session
  useEffect(() => {
    if (loading) return;
    
    const isAzure = !!import.meta.env.VITE_API_URL;
    const urlParams = new URLSearchParams(window.location.search);
    const hasToken = urlParams.has('token');
    
    if (!session && (!isAzure || !hasToken)) {
      console.log("No session or token found in ResetPasswordPage after loading, redirecting...");
      toast({ 
        title: "Session Invalid", 
        description: "Password reset link is missing, expired, or you are not logged in.", 
        variant: "destructive" 
      });
      const timer = setTimeout(() => navigate('/forgot-password'), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, session, navigate, toast]);

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.all[0];
      if (!totpFactor) throw new Error("No MFA factor found");

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId: totpFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
         factorId: totpFactor.id,
         challengeId: challenge.id,
         code: mfaCode,
      });

      if (verifyError) {
         toast({ title: "Verification Failed", description: verifyError.message, variant: "destructive" });
      } else {
         await refreshMfaStatus();
         toast({ title: "Verified", description: "MFA challenge successful. You can now update your password." });
         setShowMfa(false);
         // Auto-trigger password reset after MFA verification
         await performPasswordReset();
      }
    } catch (err: any) {
      toast({ title: "MFA Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const performPasswordReset = async () => {
    try {
      const isAzure = !!import.meta.env.VITE_API_URL;
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (isAzure && token) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password })
        });
        
        if (!res.ok) {
          const text = await res.text();
          let errorMsg = 'Password reset failed';
          try {
            const data = JSON.parse(text);
            errorMsg = data.error || data.detail || errorMsg;
          } catch {
            console.error('[ResetPassword] Non-JSON error response:', text.slice(0, 200));
            errorMsg = 'Server error – please try again in a moment.';
          }
          throw new Error(errorMsg);
        }

        setIsSuccess(true);
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully."
        });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          console.error("Password update error:", error);
          if (error.message.includes('AAL2') || error.message.includes('MFA')) {
            toast({
              title: "MFA Required",
              description: "Security check: Please enter your 6-digit MFA code to confirm this change.",
            });
            setShowMfa(true);
          } else {
            toast({ 
              title: "Reset Failed", 
              description: error.message, 
              variant: "destructive" 
            });
          }
        } else {
          setIsSuccess(true);
          toast({
            title: "Password Updated",
            description: "Your password has been changed successfully."
          });
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    } catch (err: any) {
      console.error("Exception in performPasswordReset:", err);
      toast({ 
        title: "Error", 
        description: err.message || "An unexpected error occurred", 
        variant: "destructive" 
      });
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({ title: "Passwords Mismatch", description: "The passwords you entered do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const passwordCheck = validation.password(password);
    if (!passwordCheck.isValid) {
      toast({ title: "Weak Password", description: passwordCheck.errors[0], variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    await performPasswordReset();
    setIsLoading(false);
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

          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Updated</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been changed successfully. Redirecting to login...
              </p>
            </div>
          ) : showMfa ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-4">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Two-Factor Auth</h2>
                <p className="text-sm text-muted-foreground">Enter the 6-digit code from your app to confirm password change.</p>
              </div>

              <form onSubmit={handleMfaVerify} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="mfa-code">Authentication Code</Label>
                    <Input
                      id="mfa-code"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      required
                      className="text-center text-2xl font-mono tracking-widest h-12"
                    />
                 </div>
                 <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify & Update Password'}
                 </Button>
                 <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={() => setShowMfa(false)} 
                  className="w-full text-muted-foreground"
                 >
                   <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>
              </form>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a new secure password for your account.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                      placeholder="Min 8 chars, upper, lower, number"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {[
                        { label: '8+ characters', met: password.length >= 8 },
                        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                        { label: 'Lowercase letter', met: /[a-z]/.test(password) },
                        { label: 'Number', met: /\d/.test(password) },
                      ].map((c) => (
                        <p key={c.label} className={`text-[11px] flex items-center gap-1 ${c.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {c.met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {c.label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;


