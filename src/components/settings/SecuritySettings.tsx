import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Lock,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const changePasswordSchema = z.object({
  oldPassword: z.string().min(8, { message: "Old password must be at least 8 characters." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Confirm password must be at least 8 characters." }),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInputType>({
    resolver: zodResolver(changePasswordSchema),
  });

  const fetchFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) console.error("Error listing MFA factors:", error);
    else setMfaFactors(data.all || []);
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordInputType) => {
      if (!user) throw new Error("User not authenticated");
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

  const onSubmitPassword = async (data: ChangePasswordInputType) => {
    await changePasswordMutation.mutateAsync(data);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="w-full border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-slate-900">
            <Lock className="mr-3 h-6 w-6 text-indigo-600" />
            Password Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Old Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Current password"
                    {...register("oldPassword")}
                    className="h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.oldPassword && <p className="text-sm text-red-500 font-bold">{errors.oldPassword.message}</p>}
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
                    className="h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && <p className="text-sm text-red-500 font-bold">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    {...register("confirmPassword")}
                    className="h-12 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500 font-bold">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending} className="h-12 px-8 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-700 shadow-indigo-100 shadow-lg">
              {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="w-full border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
          <CardTitle className="flex items-center text-xl font-black text-slate-900">
            <Shield className="mr-3 h-6 w-6 text-emerald-600" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {mfaFactors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-emerald-600" />
                   </div>
                   <div>
                      <p className="font-bold text-slate-900">Authenticator App</p>
                      <p className="text-xs text-emerald-700 font-medium">Factor ID: {mfaFactors[0].id}</p>
                   </div>
                </div>
                <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold h-10 rounded-xl" onClick={() => unenrollFactor(mfaFactors[0].id)}>Remove</Button>
              </div>
            </div>
          ) : isEnrolling ? (
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-inner">
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
               </div>
               <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-slate-900">Scan QR Code</h4>
                    <p className="text-sm text-slate-500 font-medium">Open your authenticator app and scan the code.</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-bold text-slate-900 text-sm">Verification Code</Label>
                    <div className="flex gap-4">
                      <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000" maxLength={6} className="h-12 rounded-xl text-center text-xl font-black w-48" />
                      <Button onClick={verifyFactor} className="h-12 px-8 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-100">Verify & Enable</Button>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setIsEnrolling(false)} className="text-slate-500 font-bold rounded-xl h-10">Cancel Enrollment</Button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center shrink-0">
                  <Smartphone className="h-10 w-10 text-indigo-600" />
               </div>
               <div className="flex-1 space-y-2 text-center md:text-left">
                  <h4 className="text-lg font-black text-slate-900">Enhance your Account Security</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">Protect your account with an additional layer of security. We support any standard TOTP authenticator app.</p>
               </div>
               <Button onClick={startEnrollment} className="h-12 px-8 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-100 shrink-0">Enable MFA</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
