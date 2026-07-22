import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Baby } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Children Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Add children who will be checking in to your facility.</p>
        </div>
        <Button onClick={addChild} variant="outline" size="sm" className="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider">
          <Plus className="w-4 h-4 text-primary" />
          Add Another Child
        </Button>
      </div>

      {children.map((child, index) => (
        <div key={index} className="p-6 border border-border/60 rounded-2xl bg-muted/20 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Baby className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Child 0{index + 1}</h4>
            </div>
            {children.length > 1 && (
              <Button 
                onClick={() => removeChild(index)} 
                variant="ghost" 
                size="sm"
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</Label>
                <Input
                  value={child.firstName}
                  onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                  placeholder="Child's first name"
                  className="h-10 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</Label>
                <Input
                  value={child.lastName}
                  onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                  placeholder="Child's last name"
                  className="h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth *</Label>
              <Input
                type="date"
                value={child.birthdate}
                onChange={(e) => updateChild(index, 'birthdate', e.target.value)}
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allergies (if any)</Label>
              <Input
                value={child.allergies}
                onChange={(e) => updateChild(index, 'allergies', e.target.value)}
                placeholder="e.g. Peanuts, Penicillin, Dairy"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Medical Notes</Label>
                <Textarea
                  value={child.medicalInfo}
                  onChange={(e) => updateChild(index, 'medicalInfo', e.target.value)}
                  placeholder="Special medical conditions or required medication"
                  rows={2}
                  className="rounded-xl resize-none text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General Care Notes</Label>
                <Textarea
                  value={child.notes}
                  onChange={(e) => updateChild(index, 'notes', e.target.value)}
                  placeholder="Preferences, special instructions, or guidance"
                  rows={2}
                  className="rounded-xl resize-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
