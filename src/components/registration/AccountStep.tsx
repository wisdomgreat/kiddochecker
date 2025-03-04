
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Your Account</h2>
      <p className="text-gray-600">Enter your phone number and create a PIN to access the check-in system</p>
      
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
          <Label htmlFor="pin">4-Digit PIN</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Create a 4-digit PIN"
            className="mt-1"
            maxLength={4}
          />
          <p className="text-xs text-gray-500 mt-1">You'll use this PIN for check-in/check-out</p>
        </div>
        
        <div>
          <Label htmlFor="confirmPin">Confirm PIN</Label>
          <Input
            id="confirmPin"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Confirm your PIN"
            className="mt-1"
            maxLength={4}
          />
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
