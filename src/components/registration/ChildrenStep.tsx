
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
  // Convert our ChildFormData to the format expected by ChildRegistrationForm
  const mapToChildFormValues = (child: ChildFormData, index: number) => {
    return {
      firstName: child.firstName,
      lastName: child.lastName,
      age: 0, // We're using birthdate instead of age, so set a default
      allergies: child.allergies,
      medicalInfo: child.medicalInfo,
      notes: child.specialNeeds, // Map specialNeeds to notes
      emergencyContactName: "",
      emergencyContactPhone: ""
    };
  };

  // Need to create a dummy "family name" for the child registration form
  const [familyName, setFamilyName] = React.useState("");

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
            
            {/* Use our custom adapter for the ChildRegistrationForm */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={child.firstName}
                    onChange={(e) => handleChildFormChange(index, 'firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={child.lastName}
                    onChange={(e) => handleChildFormChange(index, 'lastName', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={child.birthdate}
                  onChange={(e) => handleChildFormChange(index, 'birthdate', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Allergies</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={child.allergies}
                  onChange={(e) => handleChildFormChange(index, 'allergies', e.target.value)}
                  placeholder="List any allergies"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Special Needs</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={child.specialNeeds}
                  onChange={(e) => handleChildFormChange(index, 'specialNeeds', e.target.value)}
                  placeholder="Any special needs or accommodations"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Medical Information</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={child.medicalInfo}
                  onChange={(e) => handleChildFormChange(index, 'medicalInfo', e.target.value)}
                  placeholder="Any medical conditions or medications"
                />
              </div>
            </div>
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
