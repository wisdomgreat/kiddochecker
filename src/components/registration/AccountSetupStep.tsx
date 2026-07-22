import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useState } from "react";

interface AccountSetupStepProps {
  data: {
    password: string;
    confirmPassword: string;
  };
  onChange: (data: any) => void;
}

export const AccountSetupStep = ({ data, onChange }: AccountSetupStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const passwordsMatch = data.password === data.confirmPassword && data.password.length > 0;
  const passwordStrong = data.password.length >= 6;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Create Security Password</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Set a secure password for accessing your parent dashboard.</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={data.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimum 6 characters"
              required
              className="pr-10 h-10 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {data.password && (
            <div className="mt-1 text-xs flex items-center gap-1.5">
              {passwordStrong ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Password meets length requirement
                </span>
              ) : (
                <span className="text-rose-500 font-semibold flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Password must be at least 6 characters
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={data.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              required
              className="pr-10 h-10 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {data.confirmPassword && (
            <div className="mt-1 text-xs flex items-center gap-1.5">
              {passwordsMatch ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Passwords match
                </span>
              ) : (
                <span className="text-rose-500 font-semibold flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
