
import React from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneNumberFormProps {
  phoneNumber: string;
  onChange: (value: string) => void;
}

export const PhoneNumberForm = ({ phoneNumber, onChange }: PhoneNumberFormProps) => {
  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += '(' + cleaned.substring(0, 3);
      if (cleaned.length > 3) {
        formatted += ') ' + cleaned.substring(3, 6);
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, 10);
        }
      }
    }
    
    return formatted.trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    onChange(formattedValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
      <div className="relative">
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phoneNumber}
          onChange={handlePhoneChange}
          className="pr-10 bg-white text-base py-6"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Phone className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberForm;
