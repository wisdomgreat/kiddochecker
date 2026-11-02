import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, AlertCircle, Mail, ArrowRight, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';

const EnhancedLoginForm = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'login' | 'mfa' | 'verify_email'>('login');
  const [mfaCode, setMfaCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signInWithPassword, signIn } = useAuth();
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unverified = params.get('unverified');
    const paramEmail = params.get('email');
    if (paramEmail) setEmail(paramEmail);
    if (unverified === 'true') {
      setStep('verify_email');
    }
  }, []);

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
      if (err.requiresVerification || err.message?.includes('Verification') || err.message?.includes('verification')) {
        setStep('verify_email');
        setError(err.message || (isEs ? "Verifique su correo electrónico antes de ingresar." : "Please verify your email before signing in."));
        toast({
          title: isEs ? "Verificación de Correo Requerida" : "Email Verification Required",
          description: isEs ? "Por favor ingrese el código de 6 dígitos enviado a su correo." : "Please enter the 6-digit verification code sent to your email."
        });
        return;
      }
      setError(err.message || (isEs ? "Correo o contraseña no válidos" : "Invalid email or password"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return;

    setIsLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
      const res = await fetch(`${apiUrl}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || (isEs ? 'Código no válido o caducado' : 'Invalid or expired verification code'));
      }
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('bridge_token', data.token);
      }
      toast({
        title: isEs ? "¡Correo Verificado!" : "Email Verified!",
        description: isEs ? "Su cuenta está activa. ¡Bienvenido a KiddoChecker!" : "Your account is now active. Welcome to KiddoChecker!"
      });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || (isEs ? 'Error al verificar el código.' : 'Failed to verify code. Please check and try again.'));
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
        const errorData = await res.json();
        throw new Error(errorData.error || (isEs ? 'Código de verificación no válido' : 'Invalid verification code'));
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        
        {/* Left Side: Context & Institutional Authenticity */}
        <div className="md:col-span-5 p-8 sm:p-10 bg-muted/40 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-semibold text-lg tracking-tight">KiddoChecker</span>
            </Link>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                {isEs ? "Acceso Seguro al Portal" : "Secure Portal Access"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isEs 
                  ? "Para líderes de ministerio, maestros, voluntarios y tutores autorizados." 
                  : "For ministry directors, teachers, volunteers, and authorized guardians."}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{isEs ? "Control de asistencia en tiempo real" : "Real-time attendance & room rosters"}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{isEs ? "Verificación de pases de recogida de 4 dígitos" : "4-digit guardian claim pass matching"}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{isEs ? "Alertas médicas y dietéticas inmediatas" : "Immediate medical & allergy indicators"}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Green Valley Alliance Church</p>
            <p>Hosted on Microsoft Azure • TDWAS Technology</p>
          </div>
        </div>

        {/* Right Side: High-Craft Hallmark Form Stage */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-card">
          <div className="w-full max-w-sm mx-auto" ref={formRef}>
            
            {/* Step 1: Login */}
            {step === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    {isEs ? "Iniciar Sesión" : "Sign In"}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isEs ? "Ingrese con su correo institucional o registrado." : "Enter your registered email to access your dashboard."}
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-foreground">
                      {isEs ? "Correo electrónico" : "Email address"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="email"
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-lg border-input bg-background text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium text-foreground">
                        {isEs ? "Contraseña" : "Password"}
                      </Label>
                      <button 
                        type="button" 
                        onClick={() => navigate('/forgot-password')} 
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {isEs ? "¿Olvidó su contraseña?" : "Forgot password?"}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-16 h-11 rounded-lg border-input bg-background text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5"
                      >
                        {showPassword ? (isEs ? "Ocultar" : "Hide") : (isEs ? "Mostrar" : "Show")}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-lg border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span>{isEs ? "Entrar al Portal" : "Sign In to Portal"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    {isEs ? "¿Nueva familia? " : "New family? "}
                    <button 
                      type="button" 
                      onClick={() => navigate('/parent-registration')} 
                      className="text-primary hover:underline font-medium"
                    >
                      {isEs ? "Registrar familia aquí" : "Register your children here"}
                    </button>
                  </p>
                </div>

                {/* Microsoft Enterprise SSO Option */}
                <div className="pt-4 border-t border-border space-y-3">
                  <span className="block text-center text-xs text-muted-foreground font-medium">
                    {isEs ? "O use su cuenta institucional" : "Or use institutional login"}
                  </span>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => signIn()}
                    className="w-full h-10 rounded-lg text-xs font-semibold text-foreground border-border hover:bg-muted transition-colors flex items-center justify-center gap-2.5"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    <span>{isEs ? "Iniciar sesión con Microsoft" : "Sign in with Microsoft"}</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Email Verification */}
            {step === 'verify_email' && (
              <form onSubmit={handleVerifyEmailCode} className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-1">
                    <Mail className="h-3 w-3" />
                    <span>{isEs ? "Verificación de Correo" : "Email Verification"}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {isEs ? "Ingrese su código" : "Enter Verification Code"}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isEs 
                      ? `Enviamos un código de 6 dígitos a ${email || 'su correo'}. Ingréselo a continuación.` 
                      : `We sent a 6-digit code to ${email || 'your email'}. Enter it below to activate your account.`}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="verifyCode" className="text-xs font-medium text-foreground">
                    {isEs ? "Código de 6 dígitos" : "6-Digit Security Code"}
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      id="verifyCode"
                      placeholder="000000"
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-11 rounded-lg border-input bg-background text-center text-lg font-mono tracking-widest font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-lg border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading || verifyCode.length < 6} 
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span>{isEs ? "Verificar y Acceder" : "Verify & Access Portal"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep('login');
                    setVerifyCode('');
                    setError('');
                  }}
                  className="w-full h-10 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{isEs ? "Volver a Iniciar Sesión" : "Back to Sign In"}</span>
                </Button>
              </form>
            )}

            {/* Step 3: Two-Factor Authentication (MFA) */}
            {step === 'mfa' && (
              <form onSubmit={handleMfaVerify} className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-1">
                    <Shield className="h-3 w-3" />
                    <span>{isEs ? "Autenticación de 2 Factores" : "Two-Factor Authentication"}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {isEs ? "Código Authenticator" : "Authenticator Code"}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isEs 
                      ? "Abra su aplicación autenticadora e ingrese el código de 6 dígitos actual." 
                      : "Open your authenticator app and enter the current 6-digit verification code."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mfaCode" className="text-xs font-medium text-foreground">
                    {isEs ? "Código de Verificación" : "Verification Code"}
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      id="mfaCode"
                      placeholder="000000"
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-11 rounded-lg border-input bg-background text-center text-lg font-mono tracking-widest font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-lg border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading || mfaCode.length < 6} 
                  className="w-full h-11 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span>{isEs ? "Confirmar Código" : "Confirm Code"}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
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
                  className="w-full h-10 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{isEs ? "Volver a Iniciar Sesión" : "Back to Sign In"}</span>
                </Button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedLoginForm;
