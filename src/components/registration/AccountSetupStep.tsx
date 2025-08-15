
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Account Setup</h3>
      
      <div>
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Create a password (minimum 6 characters)"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {data.password && (
          <div className="mt-1 text-sm">
            <span className={passwordStrong ? 'text-green-600' : 'text-red-600'}>
              {passwordStrong ? '✓ Password is strong' : '✗ Password must be at least 6 characters'}
            </span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {data.confirmPassword && (
          <div className="mt-1 text-sm">
            <span className={passwordsMatch ? 'text-green-600' : 'text-red-600'}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
