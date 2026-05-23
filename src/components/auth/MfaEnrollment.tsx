import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Shield, ShieldCheck, ShieldAlert, Loader2, QrCode, ArrowRight, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MfaEnrollment = () => {
  const { user, isMfaEnrolled, mfaFactors, refreshMfaStatus } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'idle' | 'enrolling' | 'verifying'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refreshMfaStatus();
  }, [refreshMfaStatus]);

  const handleStartEnroll = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Enroll TOTP factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'KiddoChecker',
        friendlyName: user?.email || 'TOTP'
      });

      if (enrollError) throw enrollError;
      if (!data) throw new Error('No data returned from enrollment');

      setFactorId(data.id);
      
      // Get the QR code URL. 
      // If it exists inside data.totp, set it. Otherwise fallback.
      const qrUrl = data.totp?.qr_code || '';
      setQrCode(qrUrl);

      // 2. Challenge the factor immediately to get challengeId
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id
      });

      if (challengeError) throw challengeError;
      if (!challengeData) throw new Error('No challenge session returned');

      setChallengeId(challengeData.id);
      setStep('verifying');
      
      toast({
        title: "2FA Registration Started",
        description: "Please scan the QR code using Google Authenticator or any TOTP app."
      });
    } catch (err: any) {
      console.error('[MFA Enroll] Error:', err);
      setError(err.message || 'Failed to start MFA enrollment');
      toast({
        title: "Enrollment Failed",
        description: err.message || 'Please check your connection.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;

    setIsLoading(true);
    setError('');
    try {
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA Enabled Successfully",
        description: "Your account is now protected with two-factor authentication.",
      });

      setStep('idle');
      setCode('');
      setQrCode('');
      setFactorId('');
      setChallengeId('');
      await refreshMfaStatus();
    } catch (err: any) {
      console.error('[MFA Verify] Error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    const verifiedFactor = mfaFactors.find((f: any) => f.status === 'verified' || f.factorType === 'totp');
    const fId = verifiedFactor?.id || factorId;

    if (!fId) {
      toast({
        title: "Error",
        description: "Could not find active factor to unenroll.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.")) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: fId
      });

      if (unenrollError) throw unenrollError;

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
        variant: "default"
      });

      setStep('idle');
      await refreshMfaStatus();
    } catch (err: any) {
      console.error('[MFA Unenroll] Error:', err);
      toast({
        title: "Failed to Disable 2FA",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden font-['Outfit'] transition-all duration-300">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isMfaEnrolled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
            {isMfaEnrolled ? <ShieldCheck className="h-5.5 w-5.5" /> : <Shield className="h-5.5 w-5.5" />}
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-slate-800">
              Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Secure your account credentials
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {isMfaEnrolled ? (
            <motion.div
              key="enabled-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">2FA Protection Active</h4>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Your account is securely guarded with TOTP authentication codes.
                  </p>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50/60 border border-slate-100 p-4 rounded-2xl">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Device Factor</Label>
                <p className="text-sm font-bold text-slate-700">
                  {mfaFactors[0]?.friendlyName || user?.email || 'Authenticator Application'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Configured via Authenticator App (TOTP)
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isLoading}
                className="w-full h-12 rounded-2xl font-bold flex gap-2 items-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 shadow-none hover:shadow-sm transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                Disable Two-Factor Auth
              </Button>
            </motion.div>
          ) : step === 'verifying' ? (
            <motion.div
              key="verify-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-5"
            >
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Scan this QR code using your authenticator app (Google Authenticator, Authy, Microsoft Authenticator) then enter the code.
                </p>
              </div>

              <div className="flex justify-center p-3 bg-white border border-slate-100 rounded-2xl max-w-[220px] mx-auto shadow-inner">
                {qrCode ? (
                  <img src={qrCode} alt="TOTP Setup QR Code" className="w-[180px] h-[180px] rounded-lg" />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authCode" className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest block text-center">
                    Enter Authenticator Code
                  </Label>
                  <Input
                    id="authCode"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="h-12 rounded-xl text-center text-lg font-mono tracking-[0.2em] font-medium border-slate-200 focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('idle');
                      setCode('');
                    }}
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="flex-1 h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Verify & Enable'}
                  </Button>
                </div>
              </form>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="disabled-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 bg-slate-50/80 border border-slate-100 rounded-2xl">
                <ShieldAlert className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Two-Factor Auth Disabled</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    We highly recommend protecting your account against credentials theft.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleStartEnroll}
                disabled={isLoading}
                className="w-full h-12 rounded-2xl font-bold flex gap-2 items-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100/60 active:scale-[0.98] transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                Setup Authenticator App
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MfaEnrollment;
