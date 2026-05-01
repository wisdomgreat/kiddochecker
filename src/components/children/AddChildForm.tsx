import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import { 
  User, 
  Calendar, 
  AlertTriangle, 
  Phone, 
  FileText,
  Heart,
  Baby,
  UserPlus,
  Info,
  Shield,
  Clock,
  Users,
  MapPin,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AddChildFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Child {
  firstName: string;
  lastName: string;
  age: number;
  allergies?: string;
  medicalInfo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  photoUrl?: string;
}

const AddChildForm = ({ open, onOpenChange, onSuccess }: AddChildFormProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [allergies, setAllergies] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addChildMutation = useMutation({
    mutationFn: async (childData: Child) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('children')
        .insert({
          first_name: childData.firstName,
          last_name: childData.lastName,
          age: childData.age,
          allergies: childData.allergies,
          medical_info: childData.medicalInfo,
          emergency_contact_name: childData.emergencyContactName,
          emergency_contact_phone: childData.emergencyContactPhone,
          notes: childData.notes,
          photo_url: childData.photoUrl,
          parent_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children", user?.id] });
      toast({
        title: "Success",
        description: "Child added successfully",
      });
      onOpenChange(false);
      setFirstName("");
      setLastName("");
      setAge(undefined);
      setAllergies("");
      setMedicalInfo("");
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setNotes("");
      setPhotoUrl("");
      onSuccess?.();
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

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!firstName || !lastName || !age) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const childData: Child = {
      firstName,
      lastName,
      age,
      allergies,
      medicalInfo,
      emergencyContactName,
      emergencyContactPhone,
      notes,
      photoUrl,
    };

    addChildMutation.mutate(childData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Child</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <form onSubmit={onSubmit} className="space-y-6 mt-4">
              <div className="flex flex-col items-center justify-center mb-6">
                <Label className="mb-2">Child Photo</Label>
                <ImageUpload
                  bucket="avatars"
                  size="lg"
                  fallbackText={firstName ? firstName.charAt(0).toUpperCase() : "B"}
                  onUpload={(url) => setPhotoUrl(url)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  type="number"
                  id="age"
                  placeholder="Enter age"
                  value={age !== undefined ? age.toString() : ""}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  placeholder="Enter allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="medicalInfo">Medical Information</Label>
                <Textarea
                  id="medicalInfo"
                  placeholder="Enter medical information"
                  value={medicalInfo}
                  onChange={(e) => setMedicalInfo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  placeholder="Enter emergency contact name"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  placeholder="Enter emergency contact phone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addChildMutation.isPending}>
                  {addChildMutation.isPending ? "Adding..." : "Add Child"}
                </Button>
              </DialogFooter>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildForm;


