
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddChildModal = ({ open, onOpenChange, onSuccess }: AddChildModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const addChildMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age) || 0,
          allergies: allergies || null,
          medical_info: medicalInfo || null,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-children'] });
      toast({
        title: "Success",
        description: "Child added successfully",
      });
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error adding child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setAge("");
    setAllergies("");
    setMedicalInfo("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addChildMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Child</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="0"
              max="18"
            />
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="None"
            />
          </div>

          <div>
            <Label htmlFor="medicalInfo">Medical Information</Label>
            <Textarea
              id="medicalInfo"
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              placeholder="Any medical conditions or notes"
            />
          </div>

          <div>
            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              type="tel"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addChildMutation.isPending}>
              {addChildMutation.isPending ? "Adding..." : "Add Child"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildModal;


