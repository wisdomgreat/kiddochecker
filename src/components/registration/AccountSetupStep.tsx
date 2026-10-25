import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useState } from "react";

interface AccountSetupStepProps {
  data: {
    password: string;
    confirmPassword: string;
    securityPin?: string;
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
  const hasMinLength = data.password.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(data.password);
  const passwordStrong = hasMinLength && hasNumberOrSymbol;

  const TRIVIAL_PINS = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456', '000000', '111111'];
  const isTrivialPin = data.securityPin && TRIVIAL_PINS.includes(data.securityPin);
  const isPinValidLength = (data.securityPin?.length || 0) >= 4 && (data.securityPin?.length || 0) <= 6;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Create Security Password & PIN</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Set a secure password for your family portal and a confidential PIN for kiosk check-in.</p>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password (Minimum 8 Characters) *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={data.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="At least 8 characters with numbers"
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
            <div className="mt-1 text-xs space-y-1">
              <span className={`font-semibold flex items-center gap-1 ${hasMinLength ? 'text-emerald-600' : 'text-rose-500'}`}>
                {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} At least 8 characters
              </span>
              <span className={`font-semibold flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-600' : 'text-rose-500'}`}>
                {hasNumberOrSymbol ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />} Includes at least one number or symbol
              </span>
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

        <div className="space-y-1.5">
          <Label htmlFor="securityPin" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kiosk Security PIN (4-6 Digits) *</Label>
          <Input
            id="securityPin"
            type="password"
            maxLength={6}
            value={data.securityPin || ''}
            onChange={(e) => handleChange('securityPin', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 5829"
            required
            className="h-10 rounded-xl tracking-widest text-base"
          />
          {isTrivialPin ? (
            <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Simple sequential or repeating PINs (e.g. 1234, 0000) are not allowed.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">You will enter this 4-6 digit PIN with your mobile number at the Kiosk to check in and out.</p>
          )}
        </div>
      </div>
    </div>
  );
};
