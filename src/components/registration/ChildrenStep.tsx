
import React from "react";
import { Button } from "@/components/ui/button";
import ChildRegistrationForm from "@/components/check-in/ChildRegistrationForm";

export interface ChildFormData {
  firstName: string;
  lastName: string;
  birthdate: string;
  allergies: string;
  specialNeeds: string;
  medicalInfo: string;
}

interface ChildrenStepProps {
  children: ChildFormData[];
  handleAddChild: () => void;
  handleRemoveChild: (index: number) => void;
  handleChildFormChange: (index: number, field: keyof ChildFormData, value: string) => void;
}

const ChildrenStep = ({
  children,
  handleAddChild,
  handleRemoveChild,
  handleChildFormChange
}: ChildrenStepProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Child Information</h2>
      <p className="text-gray-600">Add information about your children</p>
      
      <div className="space-y-8">
        {children.map((child, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Child {index + 1}</h3>
              {children.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveChild(index)}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <ChildRegistrationForm 
              childData={child}
              onChange={(field, value) => handleChildFormChange(index, field as keyof ChildFormData, value)}
            />
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={handleAddChild}
          className="w-full"
        >
          Add Another Child
        </Button>
      </div>
    </div>
  );
};

export default ChildrenStep;
