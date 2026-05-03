import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, QrCode, ShieldCheck, Activity, AlertCircle, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';

const EnhancedLoginForm = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, sendNativeCode, verifyNativeCode, signIn } = useAuth();
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    try {
      await sendNativeCode(email);
      
      // Animate transition to code step
      gsap.to(formRef.current, {
        duration: 0.4,
        x: -50,
        opacity: 0,
        onComplete: () => {
          setStep('code');
          gsap.fromTo(formRef.current, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 });
        }
      });

      toast({ title: "Code Sent", description: "Check your inbox for your 6-digit code." });
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setIsLoading(true);
    setError('');
    try {
      await verifyNativeCode(email, code);
      toast({ title: "Welcome Back", description: "Identity verified successfully." });
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-['Outfit']">
      {/* BACKGROUND DECO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[450px] relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-12">
          
          {/* LOGO */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">KiddoChecker</h1>
              <p className="text-slate-500 text-sm font-medium">Securing the Future of Childcare</p>
            </div>
          </div>

          <div ref={formRef}>
            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div className="space-y-2 text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
                  <p className="text-sm text-slate-500">Enter your email to receive a secure login code.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all text-base"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>Send Magic Code <ArrowRight className="h-5 w-5" /></>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2 text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Check Your Email</h2>
                  <p className="text-sm text-slate-500">We sent a 6-digit code to <br/><span className="font-bold text-slate-700">{email}</span></p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-700 font-semibold ml-1">Verification Code</Label>
                  <Input 
                    id="code"
                    placeholder="000000"
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-slate-200 bg-white/50 focus:bg-white transition-all"
                    required
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all bg-green-600 hover:bg-green-700 flex gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                    <>Verify & Sign In <CheckCircle2 className="h-5 w-5" /></>
                  )}
                </Button>

                <button 
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-center text-sm font-bold text-primary hover:underline"
                >
                  Edit email address
                </button>
              </form>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="text-center space-y-4">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enterprise Access</p>
              <Button 
                variant="ghost" 
                onClick={() => signIn()}
                className="w-full h-12 rounded-xl text-slate-600 font-semibold gap-3 hover:bg-slate-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Azure Employee Login
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          &copy; 2026 KiddoChecker &bull; Secure Infrastructure
        </p>
      </div>
    </div>
  );
};

export default EnhancedLoginForm;
