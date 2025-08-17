import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/CleanAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddEditChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId?: string;
  onSuccess?: () => void;
}

interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const AddEditChildDialog: React.FC<AddEditChildDialogProps> = ({ open, onOpenChange, childId, onSuccess }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [allergies, setAllergies] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchChildData = async () => {
      if (childId && user) {
        setLoading(true);
        try {
          const { data: childData, error } = await supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .single();

          if (error) {
            console.error("Error fetching child:", error);
            toast({
              title: "Error",
              description: "Failed to load child data",
              variant: "destructive",
            });
            return;
          }

          if (childData) {
            setFirstName(childData.first_name || "");
            setLastName(childData.last_name || "");
            setAge(childData.age);
            setAllergies(childData.allergies || "");
            setMedicalInfo(childData.medical_info || "");
            setEmergencyContactName(childData.emergency_contact_name || "");
            setEmergencyContactPhone(childData.emergency_contact_phone || "");
            setNotes(childData.notes || "");
          }
        } catch (error) {
          console.error("Error fetching child:", error);
          toast({
            title: "Error",
            description: "Failed to load child data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Reset form if no childId is provided (i.e., adding a new child)
        setFirstName("");
        setLastName("");
        setAge(undefined);
        setAllergies("");
        setMedicalInfo("");
        setEmergencyContactName("");
        setEmergencyContactPhone("");
        setNotes("");
      }
    };

    fetchChildData();
  }, [childId, user, open, toast]);

  const handleSubmit = async () => {
    if (!firstName || !lastName) {
      toast({
        title: "Error",
        description: "First and last name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const childData = {
        first_name: firstName,
        last_name: lastName,
        age: age,
        allergies: allergies,
        medical_info: medicalInfo,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        notes: notes,
        parent_id: user?.id,
      };

      if (childId) {
        // Update existing child
        const { error } = await supabase
          .from('children')
          .update(childData)
          .eq('id', childId);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Child updated successfully!",
        });
      } else {
        // Add new child
        const { error } = await supabase
          .from('children')
          .insert(childData);

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Child added successfully!",
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error during submit:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save child data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{childId ? "Edit Child" : "Add Child"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={age !== undefined ? age.toString() : ""}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="medicalInfo">Medical Info</Label>
            <Textarea
              id="medicalInfo"
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditChildDialog;
