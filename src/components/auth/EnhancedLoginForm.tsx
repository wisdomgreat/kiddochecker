import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, QrCode, ShieldCheck, Activity, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';

const EnhancedLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const { t } = useTranslation();
 
  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signIn();
      toast({ title: t('welcome'), description: t('subtitle') });
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
      toast({ title: "Login Failed", description: err.message, variant: 'destructive' });
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
            &copy; 2026 KiddoChecker Inc. &bull; Secure Microsoft Cloud Identity
          </div>
        </div>

        {/* AUTH FORM PANEL */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
              <p className="text-sm text-muted-foreground">Access your organization's dashboard securely.</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleMicrosoftLogin} 
                disabled={isLoading || loading} 
                className="w-full h-12 text-base font-bold gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 23 23">
                      <path d="M11.5 0h11.5v11.5h-11.5zM0 0h11.5v11.5h-11.5zM11.5 11.5h11.5v11.5h-11.5zM0 11.5h11.5v11.5h-11.5z" />
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm font-bold rounded border border-destructive/20 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground leading-relaxed px-4">
                  By signing in, you agree to your organization's security policies and terms of service.
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
