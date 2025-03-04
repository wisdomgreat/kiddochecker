
import React from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PinEntryFormProps {
  pin: string;
  onChange: (value: string) => void;
}

export const PinEntryForm = ({ pin, onChange }: PinEntryFormProps) => {
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input for PIN
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pin" className="text-base font-medium">PIN</Label>
      <div className="relative">
        <Input
          id="pin"
          type="password"
          placeholder="Enter your 4-digit PIN"
          value={pin}
          onChange={handlePinChange}
          className="pr-10 bg-white text-base py-6"
          maxLength={4}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default PinEntryForm;
