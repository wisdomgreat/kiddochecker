
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";

interface AccountStepProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  pin: string;
  setPin: (value: string) => void;
  confirmPin: string;
  setConfirmPin: (value: string) => void;
  agreeToTerms: boolean;
  setAgreeToTerms: (value: boolean) => void;
  formatPhoneNumber: (value: string) => string;
}

const AccountStep = ({
  phoneNumber,
  setPhoneNumber,
  pin,
  setPin,
  confirmPin,
  setConfirmPin,
  agreeToTerms,
  setAgreeToTerms,
  formatPhoneNumber
}: AccountStepProps) => {
  const [isPinMode, setIsPinMode] = React.useState(true);
  const [showPin, setShowPin] = React.useState(false);
  const [showConfirmPin, setShowConfirmPin] = React.useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const value = e.target.value;
    // Allow any character when in password mode, only digits in PIN mode
    const newValue = isPinMode ? value.replace(/\D/g, '') : value;
    
    // Check the length (maximum of 10 characters)
    if (newValue.length <= 10) {
      setter(newValue);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Your Account</h2>
      <p className="text-gray-600">Enter your phone number and create a PIN or password to access the check-in system</p>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            placeholder="(555) 123-4567"
            className="mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="pin">{isPinMode ? "6-Digit PIN" : "Password"}</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">PIN</span>
              <Switch
                checked={!isPinMode}
                onCheckedChange={() => setIsPinMode(!isPinMode)}
              />
              <span className="text-xs text-gray-500">Password</span>
            </div>
          </div>
          <div className="relative">
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => handlePinChange(e, setPin)}
              placeholder={isPinMode ? "Create a 6-digit PIN" : "Create a password"}
              className="mt-1 pr-10"
              maxLength={10}
            />
            <button 
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">You'll use this {isPinMode ? "PIN" : "password"} for check-in/check-out</p>
        </div>
        
        <div>
          <Label htmlFor="confirmPin">Confirm {isPinMode ? "PIN" : "Password"}</Label>
          <div className="relative">
            <Input
              id="confirmPin"
              type={showConfirmPin ? "text" : "password"}
              value={confirmPin}
              onChange={(e) => handlePinChange(e, setConfirmPin)}
              placeholder={isPinMode ? "Confirm your PIN" : "Confirm your password"}
              className="mt-1 pr-10"
              maxLength={10}
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPin(!showConfirmPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 mt-4">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm leading-tight">
            I agree to the terms and conditions, including the privacy policy and consent for my children to participate in church activities.
          </Label>
        </div>
      </div>
    </div>
  );
};

export default AccountStep;
