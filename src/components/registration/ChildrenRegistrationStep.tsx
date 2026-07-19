
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface ChildData {
  firstName: string;
  lastName: string;
  birthdate: string;
  age: number;
  allergies: string;
  medicalInfo: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface ChildrenRegistrationStepProps {
  children: ChildData[];
  onChange: (children: ChildData[]) => void;
}

export const ChildrenRegistrationStep = ({ children, onChange }: ChildrenRegistrationStepProps) => {
  const addChild = () => {
    const newChild: ChildData = {
      firstName: "",
      lastName: "",
      birthdate: "",
      age: 0,
      allergies: "",
      medicalInfo: "",
      notes: "",
      emergencyContactName: "",
      emergencyContactPhone: ""
    };
    onChange([...children, newChild]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      const updatedChildren = children.filter((_, i) => i !== index);
      onChange(updatedChildren);
    }
  };

  const updateChild = (index: number, field: keyof ChildData, value: string) => {
    const updatedChildren = children.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    );
    onChange(updatedChildren);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Children Information</h3>
        <Button onClick={addChild} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      {children.map((child, index) => (
        <div key={index} className="p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Child {index + 1}</h4>
            {children.length > 1 && (
              <Button 
                onClick={() => removeChild(index)} 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={child.firstName}
                  onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                  placeholder="Child's first name"
                  required
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={child.lastName}
                  onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                  placeholder="Child's last name"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Date of Birth *</Label>
              <Input
                type="date"
                value={child.birthdate}
                onChange={(e) => updateChild(index, 'birthdate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Allergies</Label>
              <Input
                value={child.allergies}
                onChange={(e) => updateChild(index, 'allergies', e.target.value)}
                placeholder="List any allergies"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Medical Information</Label>
                <Textarea
                  value={child.medicalInfo}
                  onChange={(e) => updateChild(index, 'medicalInfo', e.target.value)}
                  placeholder="Any medical conditions or medications"
                  rows={2}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={child.notes}
                  onChange={(e) => updateChild(index, 'notes', e.target.value)}
                  placeholder="Any additional notes or special needs"
                  rows={2}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

