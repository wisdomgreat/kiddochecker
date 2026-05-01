import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Mail, Lock, Shield, QrCode, ShieldCheck, Activity, Smartphone, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';

const EnhancedLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'mfa'>('login');
  const [mfaCode, setMfaCode] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, isMfaPending, refreshMfaStatus } = useAuth();
  const { t } = useTranslation();
 
  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (!loading && user && !isMfaPending) {
      navigate('/', { replace: true });
    }
    if (isMfaPending) {
      setMode('mfa');
    }
  }, [user, loading, isMfaPending, navigate]);

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
        toast({ title: t('login'), description: error.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const { data: mfaLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaLevel?.nextLevel === 'aal2' && mfaLevel?.currentLevel !== 'aal2') {
         setMode('mfa');
         setIsLoading(false);
         return;
      }

      if (data.user) {
        // Remember email for next time
        localStorage.setItem('remembered_email', email.trim());
        toast({ title: t('welcome'), description: t('subtitle') });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) return;
    
    setIsLoading(true);
    setError('');
    console.log('[Login] Starting MFA verification...');

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified') || factors.all[0];
      if (!totpFactor) throw new Error("No MFA factor found");

      const challengePromise = supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      const { data: challenge, error: challengeError } = await Promise.race([
        challengePromise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("MFA challenge timed out")), 8000))
      ]);
      
      if (challengeError) throw challengeError;

      const verifyPromise = supabase.auth.mfa.verify({
         factorId: totpFactor.id,
         challengeId: challenge.id,
         code: mfaCode.trim(),
      });
      
      const { error: verifyError } = await Promise.race([
        verifyPromise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("MFA verification timed out")), 10000))
      ]);

      if (verifyError) {
         setError(verifyError.message);
         toast({ title: "Verification Failed", description: verifyError.message, variant: "destructive" });
      } else {
         console.log('[Login] MFA Verified, finalizing session...');
         await new Promise(r => setTimeout(r, 500));
         await refreshMfaStatus();
         toast({ title: "Verified", description: "Successfully authenticated." });
         navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('[Login] MFA exception:', err);
      setError(err.message || "An error occurred");
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
        },
      });

      if (error) {
        setError(error.message);
        toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
      } else if (data.user) {
        toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: QrCode, title: 'QR Check-in', desc: 'Secure contactless entry for children.' },
    { icon: ShieldCheck, title: 'Staff Verification', desc: 'Background track approved personnel.' },
    { icon: Activity, title: 'Live Feed', desc: 'Real-time attendance and safety alerts.' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-card border rounded-lg overflow-hidden shadow-sm">
        
        {/* INFO PANEL */}
        <div className="p-8 lg:p-12 bg-muted/30 border-r hidden lg:flex flex-col justify-between">
          <div className="space-y-12">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded border">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg tracking-tight">KiddoChecker</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">
                Securing the Future of Childcare.
              </h1>
              <p className="text-muted-foreground text-lg">
                Universal safety management for children's organizations.
              </p>
              
              <div className="space-y-4 pt-4">
                {features.map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-medium pt-8">
            &copy; 2026 KiddoChecker Inc. &bull; Secure AES-256 Auth
          </div>
        </div>

        {/* AUTH FORM PANEL */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto space-y-6">
            
            {mode === 'mfa' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-4">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Two-Factor Auth</h2>
                  <p className="text-sm text-muted-foreground">Enter the 6-digit code from your app.</p>
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
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify Account'}
                   </Button>
                   <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className="w-full text-muted-foreground"
                   >
                     <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                   </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? 'Log in to your dashboard' : 'Join our childcare community'}
                  </p>
                </div>

                <div className="flex bg-muted/50 p-1 rounded border">
                  <button 
                    onClick={() => setMode('login')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${mode === 'login' ? 'bg-background shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setMode('signup')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${mode === 'signup' ? 'bg-background shadow-sm border' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs uppercase font-bold text-muted-foreground">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs uppercase font-bold text-muted-foreground">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-9" placeholder="name@org.com" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-xs uppercase font-bold text-muted-foreground">{t('password')}</Label>
                      {mode === 'login' && <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">{t('forgot')}</Link>}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="pl-9 pr-9" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs uppercase font-bold text-muted-foreground">Confirm</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="pl-9 pr-9" placeholder="Repeat password" />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive text-xs font-bold rounded border border-destructive/20 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedLoginForm;
EnhancedLoginForm;
