import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, QrCode, ShieldCheck, Activity, AlertCircle, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';

import { useLanguage } from '@/context/LanguageContext';

const EnhancedLoginForm = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'login' | 'mfa'>('login');
  const [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signInWithPassword, signIn } = useAuth();
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError('');
    try {
      const res: any = await signInWithPassword(email, password);
      if (res?.error) {
        throw res.error;
      }
      if (res?.data?.mfaRequired) {
        setStep('mfa');
        toast({ 
          title: isEs ? "Código MFA Requerido" : "MFA Code Required", 
          description: isEs ? "Por favor ingrese su código de autenticador 2FA." : "Please enter your 2FA authenticator code." 
        });
        return;
      }
      toast({ 
        title: isEs ? "Bienvenido de nuevo" : "Welcome Back", 
        description: isEs ? "Identidad verificada con éxito." : "Identity verified successfully." 
      });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || (isEs ? "Correo o contraseña no válidos" : "Invalid email or password"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) return;
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: mfaCode })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || (isEs ? 'Código de verificación no válido' : 'Invalid verification code'));
      }
      const { token } = await res.json();
      localStorage.setItem('bridge_token', token);
      
      toast({ 
        title: isEs ? "Bienvenido de nuevo" : "Welcome Back", 
        description: isEs ? "Identidad verificada con éxito." : "Identity verified successfully." 
      });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || (isEs ? "Código MFA no válido o caducado" : "Invalid or expired MFA code"));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: QrCode, title: isEs ? 'Registro con QR' : 'QR Check-in', desc: isEs ? 'Entrada segura sin contacto para niños.' : 'Secure contactless entry for children.' },
    { icon: ShieldCheck, title: isEs ? 'Verificación de Personal' : 'Staff Verification', desc: isEs ? 'Verificación de antecedentes del personal autorizado.' : 'Background track approved personnel.' },
    { icon: Activity, title: isEs ? 'Registro en Vivo' : 'Live Feed', desc: isEs ? 'Asistencia y alertas de seguridad en tiempo real.' : 'Real-time attendance and safety alerts.' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 md:p-10 font-['Outfit']">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
        
        {/* LEFT PANEL: BRANDING & FEATURES */}
        <div className="lg:col-span-7 p-10 md:p-16 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          {/* DECO BLURS */}
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px]" />

          <div className="relative z-10 space-y-12">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight">KiddoChecker</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {isEs ? (
                  <>Asegurando el Futuro <br/><span className="text-primary">del Cuidado Infantil.</span></>
                ) : (
                  <>Securing the Future <br/><span className="text-primary">of Childcare.</span></>
                )}
              </h1>
              <p className="text-slate-300 text-lg md:text-xl max-w-md font-medium">
                {isEs 
                  ? "Gestión de seguridad universal para organizaciones infantiles." 
                  : "Universal safety management for children's organizations."}
              </p>
              
              <div className="space-y-6 pt-8">
                {features.map((f, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="mt-1 p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{f.title}</h4>
                      <p className="text-sm text-slate-300 leading-relaxed max-w-xs">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-500 font-bold uppercase tracking-widest pt-12 flex items-center gap-4">
            <span>&copy; 2026 KiddoChecker Inc.</span>
            <span className="text-slate-700">|</span>
            <a 
              href="https://tdwas.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {isEs ? "Tecnología De" : "Powered by"} <span className="text-slate-300">TDWAS Technology</span>
            </a>
          </div>
        </div>

        {/* RIGHT PANEL: AUTH FORM */}
        <div className="lg:col-span-5 p-10 md:p-16 flex flex-col justify-center bg-white/50">
          <div className="w-full max-w-sm mx-auto" ref={formRef}>
            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isEs ? "Iniciar Sesión" : "Sign In"}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {isEs ? "Ingrese sus credenciales para acceder a su panel." : "Enter your credentials to access your dashboard."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-bold ml-1 uppercase text-[10px] tracking-widest">
                      {isEs ? "Correo Electrónico" : "Email Address"}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="email"
                        placeholder="nombre@ejemplo.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 rounded-2xl border-slate-200 bg-white focus:ring-4 focus:ring-primary/10 transition-all text-base font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700 font-bold ml-1 uppercase text-[10px] tracking-widest">
                        {isEs ? "Contraseña" : "Password"}
                      </Label>
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] font-bold text-primary hover:underline tracking-widest uppercase">
                        {isEs ? "¿Olvidó su contraseña?" : "Forgot Password?"}
                      </button>
                    </div>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-white focus:ring-4 focus:ring-primary/10 transition-all text-base font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? (isEs ? "Ocultar" : "Hide") : (isEs ? "Mostrar" : "Show")}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex gap-2 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>{isEs ? "Iniciar Sesión" : "Sign In"} <ArrowRight className="h-5 w-5" /></>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-sm text-slate-500 font-medium">
                    {isEs ? "¿No tiene una cuenta? " : "Don't have an account? "}
                    <button 
                      type="button" 
                      onClick={() => navigate('/parent-registration')} 
                      className="text-primary hover:underline font-bold"
                    >
                      {isEs ? "Regístrese aquí" : "Register here"}
                    </button>
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleMfaVerify} className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Two-Factor Auth</h2>
                  <p className="text-slate-500 font-medium">Enter the 6-digit code from your authenticator app to complete sign-in.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode" className="text-slate-700 font-bold ml-1 uppercase text-[10px] tracking-widest">Verification Code</Label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        id="mfaCode"
                        placeholder="000000"
                        type="text"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        className="pl-12 h-14 rounded-2xl border-slate-200 bg-white focus:ring-4 focus:ring-primary/10 transition-all text-center text-xl font-mono tracking-[0.3em] font-medium"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex gap-2 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>Verify Code <ArrowRight className="h-5 w-5" /></>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep('login');
                    setMfaCode('');
                    setError('');
                  }}
                  className="w-full h-12 rounded-xl text-slate-500 font-semibold"
                >
                  Back to Sign In
                </Button>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </form>
            )}

            <div className="mt-12 pt-8 border-t border-slate-100">
              <div className="text-center space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Enterprise Login</p>
                <Button 
                  variant="outline" 
                  onClick={() => signIn()}
                  className="w-full h-12 rounded-xl text-slate-600 font-semibold gap-3 border-2 hover:bg-slate-50 transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Sign in with Microsoft
                </Button>
              </div>
            </div>
            <div className="mt-8 text-center">
              <a 
                href="https://tdwas.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-primary transition-colors"
              >
                Learn more about TDWAS Technology
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedLoginForm;
