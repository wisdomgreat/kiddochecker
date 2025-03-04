
import React from "react";
import { ChildFormData } from "./ChildrenStep";

interface ReviewStepProps {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  children: ChildFormData[];
}

const ReviewStep = ({
  phoneNumber,
  firstName,
  lastName,
  email,
  address,
  emergencyContact,
  emergencyPhone,
  children
}: ReviewStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Information</h2>
      <p className="text-gray-600">Please review your information before submitting</p>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Account Information</h3>
          <p>Phone: {phoneNumber}</p>
          <p>PIN: **** (hidden for security)</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Parent Information</h3>
          <p>Name: {firstName} {lastName}</p>
          {email && <p>Email: {email}</p>}
          {address && <p>Address: {address}</p>}
          {emergencyContact && <p>Emergency Contact: {emergencyContact} ({emergencyPhone})</p>}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Children</h3>
          {children.map((child, index) => (
            <div key={index} className="mt-2 border-t pt-2">
              <p>Child {index + 1}: {child.firstName} {child.lastName}</p>
              {child.birthdate && <p>Birthdate: {child.birthdate}</p>}
              {child.allergies && <p>Allergies: {child.allergies}</p>}
              {child.specialNeeds && <p>Special Needs: {child.specialNeeds}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
