
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Smartphone, LogOut, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFABarrierProps {
  children: React.ReactNode;
}

/**
 * MFABarrier - A security component that intercepts navigation if MFA is required.
 * Instead of redirecting to /login, it shows a non-bypassable overlay.
 * This solves the "weird redirects" and "popping up" issues.
 */
const MFABarrier = ({ children }: MFABarrierProps) => {
  const { user, userRole, isMfaPending, refreshMfaStatus, signOut } = useAuth();
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Kiosks are exempt from MFA for operational continuity
  const isExempt = userRole === 'kiosk';

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.all[0];
      if (!totpFactor) throw new Error("No MFA factor found. Please contact support.");

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
         setError(verifyError.message);
      } else {
         await refreshMfaStatus();
         toast({ title: "Identity Verified", description: "Welcome back to your secure session." });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMfaPending && !isExempt) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
        <div className="w-full max-w-md p-8 bg-card border rounded-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Security Verification</h2>
              <p className="text-sm text-muted-foreground">
                Your session requires additional verification. Please enter the 6-digit code from your authenticator app.
              </p>
            </div>
          </div>

          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-barrier-code" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                Verification Code
              </Label>
              <div className="relative group">
                <Smartphone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="mfa-barrier-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000 000"
                  maxLength={6}
                  required
                  autoFocus
                  className="pl-10 h-12 text-2xl font-mono tracking-[0.3em] font-bold text-center bg-muted/30 focus-visible:ring-primary"
                />
              </div>
              {error && (
                <p className="text-xs font-bold text-destructive animate-in slide-in-from-top-1">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 gap-2 text-base font-bold shadow-lg shadow-primary/20">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  Verify Identity <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 flex flex-col gap-2">
            <Button 
              variant="ghost" 
              onClick={() => signOut()} 
              className="text-xs font-bold text-muted-foreground hover:text-destructive gap-2"
            >
              <LogOut className="h-3 w-3" /> Sign out of this account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MFABarrier;
