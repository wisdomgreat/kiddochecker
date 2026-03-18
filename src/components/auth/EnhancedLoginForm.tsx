import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Mail, Lock, Shield, QrCode, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  React.useEffect(() => {
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
        toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
        return;
      }
      if (data.user) {
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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
        return;
      }
      if (data.user) {
        toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: QrCode,
      title: 'Contactless QR Check-in',
      desc: 'Parents scan a QR code — kids are checked in seconds.',
    },
    {
      icon: ShieldCheck,
      title: 'Staff Background Verification',
      desc: 'Track certifications and approvals before anyone works with children.',
    },
    {
      icon: Activity,
      title: 'Real-time Attendance Feed',
      desc: "Always know who's present. Instant alerts for allergies and notes.",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden font-sans">

      {/* ━━━ LEFT HERO PANEL ━━━ */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 40%, #7c3aed 100%)' }}
      >
        {/* Glowing orbs */}
        <div className="absolute top-[-8%] left-[-5%] w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] right-[-8%] w-[55%] h-[55%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight font-heading">KiddoChecker</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-violet-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trusted by child-care organisations worldwide
          </div>

          <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.1] mb-6 font-heading">
            Protect Every<br />
            <span style={{
              background: 'linear-gradient(90deg, #a5b4fc, #e879f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Child, Every Day.
            </span>
          </h1>
          <p className="text-indigo-100/80 text-lg leading-relaxed max-w-md mb-12">
            The all-in-one digital check-in platform built for churches, daycares, and youth organisations that take child safety seriously.
          </p>

          {/* Feature mini-cards */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white/8 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-violet-200" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">{title}</p>
                  <p className="text-indigo-100/65 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 flex items-center gap-6">
          {['SOC 2 Ready', 'COPPA Compliant', 'Data Encrypted'].map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-indigo-200/60 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              {b}
            </div>
          ))}
        </div>
      </div>


      {/* ━━━ RIGHT FORM PANEL ━━━ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white lg:rounded-l-[3rem] shadow-2xl relative z-10 transition-all">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-black text-slate-900 text-2xl tracking-tighter font-heading">KiddoChecker</span>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight font-heading">
              {mode === 'login' ? t('welcomeBack') : t('createAccount')}
            </h2>
            <p className="text-slate-500 mt-3 text-lg font-medium leading-relaxed">
              {mode === 'login'
                ? t('signInToDashboard')
                : t('joinCommunityForFree')}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-[1.5rem] p-1.5 mb-10">
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 ${
                  mode === tab
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'login' ? t('signIn') : t('signUp')}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-700 text-xs font-black">!</span>
              </div>
              <p className="text-red-800 text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}

          {/* ── SIGN IN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-slate-900 font-black text-sm ml-1">{t('emailAddress')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-base font-medium"
                    placeholder="name@organization.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="login-password" className="text-slate-900 font-black text-sm">{t('password')}</Label>
                  <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">{t('forgot')}</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-base font-medium"
                    placeholder="Enter password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-[1.5rem] font-black text-lg text-white shadow-2xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {isLoading ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t('loading')}…</> : t('startExploring')}
              </Button>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Verified Secure</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <div className="flex items-center justify-center gap-8 text-[11px] text-slate-400 font-bold">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> AES-256</div>
                <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-indigo-500" /> SSL Encrypted</div>
              </div>
            </form>
          )}

          {/* ── SIGN UP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-first" className="text-slate-900 font-black text-sm ml-1">{t('firstName')}</Label>
                  <Input
                    id="signup-first"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-last" className="text-slate-900 font-black text-sm ml-1">{t('lastName')}</Label>
                  <Input
                    id="signup-last"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-slate-900 font-black text-sm ml-1">Work Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    placeholder="jane@organization.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-slate-900 font-black text-sm ml-1">Create Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="text-slate-900 font-black text-sm ml-1">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-[1.5rem] font-black text-lg text-white shadow-2xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
              >
                {isLoading ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t('loading')}... </> : t('joinKiddoChecker')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;