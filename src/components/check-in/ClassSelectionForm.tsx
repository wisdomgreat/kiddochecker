import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export interface ClassSelectionFormProps {
  onComplete?: (data: any) => void;
  onBack?: () => void;
}

const ClassSelectionForm: React.FC<ClassSelectionFormProps> = ({ onComplete, onBack }) => {
  const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
  
  const classes = [
    { id: "1", name: "Toddlers", room: "Room 101", ageRange: "1-2 years" },
    { id: "2", name: "Preschool", room: "Room 102", ageRange: "3-4 years" },
    { id: "3", name: "Kindergarten", room: "Room 103", ageRange: "5-6 years" },
    { id: "4", name: "Elementary", room: "Room 104", ageRange: "7-10 years" },
  ];
  
  const handleSubmit = () => {
    if (selectedClass && onComplete) {
      const classData = classes.find(c => c.id === selectedClass);
      onComplete(classData);
    }
  };
  
  return (
    <div className="space-y-4">
      <RadioGroup value={selectedClass || ""} onValueChange={setSelectedClass}>
        <div className="grid grid-cols-1 gap-4">
          {classes.map((classItem) => (
            <Card key={classItem.id} className={`p-4 cursor-pointer ${
              selectedClass === classItem.id ? 'ring-2 ring-purple-500' : ''
            }`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={classItem.id} id={`class-${classItem.id}`} />
                <div className="flex-1">
                  <Label htmlFor={`class-${classItem.id}`} className="text-base font-medium">
                    {classItem.name}
                  </Label>
                  <div className="text-sm text-gray-500">
                    <p>{classItem.room}</p>
                    <p>Ages: {classItem.ageRange}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>
      
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={!selectedClass}
          className="ml-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ClassSelectionForm;
