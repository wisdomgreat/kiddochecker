import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, Shield } from "lucide-react";

export const ChangePasswordCard = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isValid = hasLength && hasUpper && hasLower && hasNumber && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (!isValid) {
      toast({
        title: "Weak Password",
        description: "Password must meet all complexity requirements.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('kiddochecker_token') || localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      if (data.token) {
        localStorage.setItem('kiddochecker_token', data.token);
        localStorage.setItem('token', data.token);
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed. All other prior sessions have been invalidated for security.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="text-base font-bold">Change Password</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Update your login password. Changing your password will automatically invalidate other active sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-pwd" className="text-xs font-semibold">Current Password</Label>
            <div className="relative">
              <Input
                id="current-pwd"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pwd" className="text-xs font-semibold">New Password</Label>
            <div className="relative">
              <Input
                id="new-pwd"
                type={showNew ? "text" : "password"}
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd" className="text-xs font-semibold">Confirm New Password</Label>
            <Input
              id="confirm-pwd"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Complexity indicators */}
          {newPassword.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border">
              <div className={`flex items-center gap-1.5 ${hasLength ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle className="h-3 w-3" /> 8+ Characters
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle className="h-3 w-3" /> Uppercase (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle className="h-3 w-3" /> Lowercase (a-z)
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                <CheckCircle className="h-3 w-3" /> Number (0-9)
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isValid || !currentPassword}
            className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordCard;
