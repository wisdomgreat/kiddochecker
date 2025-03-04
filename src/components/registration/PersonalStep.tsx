
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalStepProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  emergencyContact: string;
  setEmergencyContact: (value: string) => void;
  emergencyPhone: string;
  setEmergencyPhone: (value: string) => void;
  formatPhoneNumber: (value: string) => string;
}

const PersonalStep = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  address,
  setAddress,
  emergencyContact,
  setEmergencyContact,
  emergencyPhone,
  setEmergencyPhone,
  formatPhoneNumber
}: PersonalStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parent Information</h2>
      <p className="text-gray-600">Tell us a bit about yourself</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Your last name"
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your address"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
          <Input
            id="emergencyContact"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Emergency contact name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="emergencyPhone">Emergency Phone (Optional)</Label>
          <Input
            id="emergencyPhone"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(formatPhoneNumber(e.target.value))}
            placeholder="Emergency contact phone"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalStep;
