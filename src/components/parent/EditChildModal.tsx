
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface EditChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: Child | null;
  onSuccess: () => void;
}

const EditChildModal = ({ open, onOpenChange, child, onSuccess }: EditChildModalProps) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    allergies: "",
    medical_info: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (child) {
      setFormData({
        first_name: child.first_name || "",
        last_name: child.last_name || "",
        age: child.age?.toString() || "",
        allergies: child.allergies || "",
        medical_info: child.medical_info || "",
        emergency_contact_name: child.emergency_contact_name || "",
        emergency_contact_phone: child.emergency_contact_phone || "",
      });
    }
  }, [child]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('children')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          age: formData.age ? parseInt(formData.age) : null,
          allergies: formData.allergies || null,
          medical_info: formData.medical_info || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
        })
        .eq('id', child.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child information updated successfully",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Error updating child:", error);
      toast({
        title: "Error",
        description: "Failed to update child information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Child Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="List any allergies..."
            />
          </div>

          <div>
            <Label htmlFor="medical_info">Medical Information</Label>
            <Textarea
              id="medical_info"
              value={formData.medical_info}
              onChange={(e) => setFormData({ ...formData, medical_info: e.target.value })}
              placeholder="Any important medical information..."
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Updating..." : "Update Child"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditChildModal;
