import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock,
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  Monitor,
  LogOut as LogOutIcon,
  RefreshCw,
  Clock,
  Globe
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { validation } from "@/utils/validation";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().superRefine((val, ctx) => {
    const result = validation.password(val);
    if (!result.isValid) {
      result.errors.forEach((err) => {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
      });
    }
  }),
  confirmPassword: z.string().min(1, { message: "Please confirm your new password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordInputType = z.infer<typeof changePasswordSchema>;

const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordInputType>({
    resolver: zodResolver(changePasswordSchema),
  });

  const fetchFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) console.error("Error listing MFA factors:", error);
    else setMfaFactors(data.all || []);
  };

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_active_sessions');
      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
    fetchSessions();
  }, []);


  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordInputType) => {
      if (!user?.email) throw new Error("User not authenticated or email not available.");

      // SECURITY: Verify the old password is correct before allowing the change.
      // This prevents session hijacking attacks where an attacker with a stolen
      // session token could change the password without knowing the current one.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.oldPassword,
      });

      if (verifyError) {
        throw new Error("Current password is incorrect. Please try again.");
      }

      // Old password verified — now update to the new one
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Success", description: "Password changed successfully. You will be signed out for security reasons." });
      await signOut();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to change password.", variant: "destructive" });
    },
  });

  const startEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "KiddoChecker",
      friendlyName: user?.email || "User Account",
    });

    if (error) {
       toast({ title: "Enrollment Error", description: error.message, variant: "destructive" });
       return;
    }

    setQrCode(data.totp.qr_code);
    setFactorId(data.id);
    setIsEnrolling(true);
  };

  const verifyFactor = async () => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
       toast({ title: "Challenge Error", description: challengeError.message, variant: "destructive" });
       return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    if (verifyError) {
       toast({ title: "Verification Failed", description: verifyError.message, variant: "destructive" });
    } else {
       toast({ title: "MFA Enabled", description: "Your account is now protected with MFA." });
       setIsEnrolling(false);
       fetchFactors();
    }
  };

  const unenrollFactor = async (fid: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: fid });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "MFA Disabled", description: "Factor removed successfully." });
      fetchFactors();
    }
  };

  const onRevokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('revoke_session', { p_session_id: sessionId });
      if (error) throw error;
      toast({ title: "Session Revoked", description: "The device has been logged out." });
      fetchSessions();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const onSubmitPassword = async (data: ChangePasswordInputType) => {
    await changePasswordMutation.mutateAsync(data);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Password Security
          </CardTitle>
          <CardDescription>Update your login credentials.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Old Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Current password"
                    {...register("oldPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.oldPassword && <p className="text-xs text-destructive font-medium">{errors.oldPassword.message}</p>}
              </div>
              <div />
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    {...register("newPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {(() => {
                  const pw = watch('newPassword') || '';
                  if (pw.length === 0) return null;
                  const checks = [
                    { label: '8+ characters', met: pw.length >= 8 },
                    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
                    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
                    { label: 'Number', met: /\d/.test(pw) },
                  ];
                  return (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {checks.map((c) => (
                        <p key={c.label} className={`text-[11px] flex items-center gap-1 ${c.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {c.met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {c.label}
                        </p>
                      ))}
                    </div>
                  );
                })()}
                {errors.newPassword && <p className="text-xs text-destructive font-medium">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    {...register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending} className="mt-2">
              {changePasswordMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {mfaFactors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center border">
                      <Smartphone className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                      <p className="font-bold text-sm">Authenticator App</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">ID: {mfaFactors[0].id}</p>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => unenrollFactor(mfaFactors[0].id)}>Remove</Button>
              </div>
            </div>
          ) : isEnrolling ? (
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
               <div className="bg-card p-2 border rounded-md shadow-sm">
                  <img src={qrCode} alt="MFA QR Code" className="w-40 h-40" />
               </div>
               <div className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <h4 className="font-bold">Scan QR Code</h4>
                    <p className="text-sm text-muted-foreground">Open your authenticator app and scan the code above.</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Verification Code</Label>
                    <div className="flex gap-3">
                      <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000" maxLength={6} className="text-center text-lg font-mono tracking-widest w-32" />
                      <Button onClick={verifyFactor}>Verify & Enable</Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsEnrolling(false)} className="text-muted-foreground">Cancel Enrollment</Button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 border border-dashed rounded-md">
               <div className="w-16 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
               </div>
               <div className="flex-1 space-y-1 text-center md:text-left">
                  <h4 className="font-bold">Enhance Account Security</h4>
                  <p className="text-sm text-muted-foreground">Protect your account with an additional layer of security. We support any standard TOTP authenticator app.</p>
               </div>
               <Button onClick={startEnrollment} className="shrink-0">Enable MFA</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
              <CardDescription>Devices currently logged into your account.</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchSessions} 
              disabled={isSessionsLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isSessionsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">No active sessions found.</p>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-background rounded-full border shadow-sm">
                      <Monitor className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate max-w-[200px]">
                          {session.user_agent?.includes('Chrome') ? 'Google Chrome' : 
                           session.user_agent?.includes('Firefox') ? 'Mozilla Firefox' :
                           session.user_agent?.includes('Safari') ? 'Apple Safari' : 'Web Browser'}
                        </p>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-bold uppercase">Active</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3" /> {session.ip || 'Unknown IP'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> Last active: {new Date(session.last_accessed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[300px]">
                        {session.user_agent}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRevokeSession(session.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 shrink-0 self-end sm:self-center"
                  >
                    <LogOutIcon className="h-3 w-3" /> Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>

  );
};

export default SecuritySettings;


