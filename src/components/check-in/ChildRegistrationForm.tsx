import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";

export interface ChildRegistrationFormProps {
  onComplete?: (data: any) => void;
  onBack?: () => void;
}

const ChildRegistrationForm: React.FC<ChildRegistrationFormProps> = ({ onComplete, onBack }) => {
  // This is a mock implementation
  // In a real app, you would fetch children data based on the phone number
  const mockChildren = [
    { id: "child1", name: "Emma Johnson", age: 5, allergies: "Peanuts" },
    { id: "child2", name: "Noah Smith", age: 7, allergies: null },
    { id: "child3", name: "Olivia Williams", age: 4, allergies: "Dairy" },
  ];

  const [selectedChildren, setSelectedChildren] = React.useState<string[]>([]);

  const handleCheckboxChange = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const handleContinue = () => {
    if (selectedChildren.length === 0) return;
    
    // Find the selected child data
    const childData = mockChildren.find(child => child.id === selectedChildren[0]);
    
    if (onComplete && childData) {
      onComplete(childData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Child</Label>
        <div className="grid gap-2">
          {mockChildren.map((child) => (
            <Card key={child.id} className="p-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id={`child-${child.id}`}
                  checked={selectedChildren.includes(child.id)}
                  onCheckedChange={() => handleCheckboxChange(child.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={`child-${child.id}`} className="font-medium">
                    {child.name}
                  </Label>
                  <div className="text-xs text-gray-500">
                    Age: {child.age}
                    {child.allergies && (
                      <span className="text-red-500 ml-2">
                        Allergies: {child.allergies}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-between">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button 
          onClick={handleContinue}
          disabled={selectedChildren.length === 0}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChildRegistrationForm;
