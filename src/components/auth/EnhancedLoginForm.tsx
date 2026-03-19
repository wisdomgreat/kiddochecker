import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Mail, Lock, Shield, QrCode, ShieldCheck, Activity, Smartphone, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
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
        toast({ title: t('login'), description: error.message, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // Check for MFA requirement
      const { data: mfaLevel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaLevel?.nextLevel === 'aal2' && mfaLevel?.currentLevel !== 'aal2') {
         setMode('mfa');
         setIsLoading(false);
         return;
      }

      if (data.user) {
        toast({ title: t('welcome'), description: t('parentAccess') });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
         setError(verifyError.message);
         toast({ title: "Verification Failed", description: verifyError.message, variant: "destructive" });
      } else {
         toast({ title: "Verified", description: "Successfully authenticated." });
         navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
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
    { icon: QrCode, title: 'Contactless QR Check-in', desc: 'Parents scan a QR code — kids are checked in seconds.' },
    { icon: ShieldCheck, title: 'Staff Background Verification', desc: 'Track certifications and approvals before anyone works with children.' },
    { icon: Activity, title: 'Real-time Attendance Feed', desc: "Always know who's present. Instant alerts for allergies and notes." },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden font-sans">
      {/* LEFT HERO PANEL */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #7c3aed 100%)' }}>
        <div className="absolute top-[-8%] left-[-5%] w-[50%] h-[50%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] right-[-8%] w-[55%] h-[55%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
             <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-white text-2xl tracking-tighter">KiddoChecker</span>
        </div>

        <div className="relative z-10 space-y-8 max-w-xl">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-black text-white leading-[1.05] tracking-tight">
             Securing the <span className="text-indigo-200">Future</span> of Childcare.
          </motion.h1>
          <p className="text-indigo-100 text-xl font-medium leading-relaxed opacity-90">
             The most advanced platform for check-ins, notifications, and safety management in children's organizations.
          </p>
          <div className="pt-6 space-y-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20"><f.icon className="h-5 w-5 text-indigo-200" /></div>
                <div><h4 className="text-white font-bold text-lg">{f.title}</h4><p className="text-indigo-100/70 text-sm font-medium">{f.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-indigo-100/50 text-sm font-bold flex gap-8">
          <span>&copy; 2024 KiddoChecker Inc.</span>
          <span>AES-256 SSL Encrypted</span>
        </div>
      </div>

      {/* RIGHT AUTH FORM */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 bg-white relative">
        <div className="w-full max-w-[440px] space-y-8">
          <AnimatePresence mode="wait">
            {mode === 'mfa' ? (
              <motion.div key="mfa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                    <Smartphone className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Two-Factor Auth</h2>
                  <p className="text-slate-500 font-medium">Please enter the 6-digit code from your authenticator app to continue.</p>
                </div>

                <form onSubmit={handleMfaVerify} className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-slate-900 font-black text-sm ml-1">Authentication Code</Label>
                      <Input
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        required
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-center text-3xl font-black tracking-[0.5em]"
                      />
                   </div>
                   <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Sign In'}
                   </Button>
                   <button type="button" onClick={() => setMode('login')} className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 flex items-center justify-center gap-2">
                      <ArrowLeft className="h-4 w-4" /> Cancel and return
                   </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="space-y-3">
                  <Badge variant="outline" className="rounded-full px-4 py-1 border-indigo-100 bg-indigo-50 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">
                    {mode === 'login' ? 'Authentication' : 'Registration'}
                  </Badge>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                    {mode === 'login' ? 'Welcome Back' : 'Join KiddoChecker'}
                  </h2>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  <button onClick={() => setMode('login')} className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Login</button>
                  <button onClick={() => setMode('signup')} className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all ${mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sign Up</button>
                </div>

                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="font-black text-sm ml-1">First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} required className="h-12 rounded-xl" placeholder="John" /></div>
                      <div className="space-y-2"><Label className="font-black text-sm ml-1">Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required className="h-12 rounded-xl" placeholder="Doe" /></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="font-black text-sm ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium" placeholder="name@organization.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <Label className="font-black text-sm">{t('password')}</Label>
                      {mode === 'login' && <Link to="/forgot-password" title={t('forgot')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider">{t('forgot')}</Link>}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="font-black text-sm ml-1">Confirm Password</Label>
                      <Input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium" placeholder="Repeat password" />
                    </div>
                  )}

                  {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-2xl border border-rose-100 flex items-center gap-3"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</motion.div>}

                  <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" /> : mode === 'login' ? 'Sign In Now' : 'Create Account'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant, className }: any) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const AlertTriangle = ({ className }: any) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default EnhancedLoginForm;