
import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PinEntryFormProps {
  pin: string;
  onChange: (value: string) => void;
}

export const PinEntryForm = ({ pin, onChange }: PinEntryFormProps) => {
  const [isPinMode, setIsPinMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow any character when in password mode, only digits in PIN mode
    const newValue = isPinMode ? value.replace(/\D/g, '') : value;
    
    // Check the length (maximum of 10 characters)
    if (newValue.length <= 10) {
      onChange(newValue);
    }
  };

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="pin" className="text-base font-medium">
          {isPinMode ? "PIN" : "Password"}
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">PIN</span>
          <Switch
            checked={!isPinMode}
            onCheckedChange={() => setIsPinMode(!isPinMode)}
          />
          <span className="text-sm text-gray-500">Password</span>
        </div>
      </div>
      <div className="relative">
        <Input
          id="pin"
          type={showPassword ? "text" : "password"}
          placeholder={isPinMode ? "Enter your 6-digit PIN" : "Enter your password"}
          value={pin}
          onChange={handlePinChange}
          className="pr-10 bg-card text-base py-6"
          maxLength={10}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
          <button 
            type="button"
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {isPinMode 
          ? "PIN must be at least 6 digits long" 
          : "Password must be at least 6 characters long"}
      </p>
    </div>
  );
};

export default PinEntryForm;

