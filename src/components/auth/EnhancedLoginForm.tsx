import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, QrCode, ShieldCheck, Activity, AlertCircle, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';

const EnhancedLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMsLoading, setIsMsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signIn, signInWithPassword } = useAuth();
  const { t } = useTranslation();
 
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError('');
    try {
      await signInWithPassword(email, password);
      toast({ title: t('welcome'), description: t('subtitle') });
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsMsLoading(true);
    setError('');
    try {
      await signIn();
      toast({ title: t('welcome'), description: t('subtitle') });
    } catch (err: any) {
      setError(err.message || "An error occurred during Microsoft login");
    } finally {
      setIsMsLoading(false);
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
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
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
            &copy; 2026 KiddoChecker Inc. &bull; Secure Multi-Auth Gateway
          </div>
        </div>

        {/* AUTH FORM PANEL */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
              <p className="text-sm text-muted-foreground font-medium">Access your organization's dashboard.</p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || loading} 
                className="w-full h-11 font-bold text-base"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue with Email'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold">Or continue with</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                variant="outline"
                onClick={handleMicrosoftLogin} 
                disabled={isMsLoading || loading} 
                className="w-full h-11 font-bold gap-3 transition-all border-2 hover:bg-muted/50"
              >
                {isMsLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 23 23">
                      <path d="M11.5 0h11.5v11.5h-11.5zM0 0h11.5v11.5h-11.5zM11.5 11.5h11.5v11.5h-11.5zM0 11.5h11.5v11.5h-11.5z" />
                    </svg>
                    Microsoft Account
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded border border-destructive/20 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground leading-relaxed px-4">
                  By signing in, you agree to our security policies and terms of service.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnhancedLoginForm;
EnhancedLoginForm;
