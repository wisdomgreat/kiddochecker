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
import { Badge } from "@/components/ui/badge";
import { Loader2, Baby, Heart, ShieldAlert, Phone, User, Stethoscope, Info, Pill, Trash2, X, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [classId, setClassId] = useState<string | null>(null);
  const [currentChildParentId, setCurrentChildParentId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  // Medical Profile State
  const [medicalData, setMedicalData] = useState<any>({
    allergies: [],
    medications: [],
    conditions: [],
    dietary_restrictions: '',
    blood_type: '',
    emergency_notes: '',
    doctor_name: '',
    doctor_phone: '',
    insurance_provider: '',
    insurance_number: ''
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const { user, isAdmin, isParent } = useAuth();

  const canEditHealth = isAdmin || (isParent && (!childId || currentChildParentId === user?.id));

  useEffect(() => {
    const fetchChildAndMedicalData = async () => {
      if (childId && user && open) {
        setLoading(true);
        try {
          // Fetch base child data
          const { data: childData, error: childError } = await supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .single();

          if (childError) throw childError;

          if (childData) {
            setFirstName(childData.first_name || "");
            setLastName(childData.last_name || "");
            setAge(childData.age);
            setEmergencyContactName(childData.emergency_contact_name || "");
            setEmergencyContactPhone(childData.emergency_contact_phone || "");
            setNotes(childData.notes || "");
            setClassId((childData as any).class_id);
            setCurrentChildParentId(childData.parent_id);
          }

          // Fetch medical profile
          const { data: medicalProfile, error: medicalError } = await (supabase
            .from('child_medical_profiles' as any) as any)
            .select('*')
            .eq('child_id', childId)
            .maybeSingle();

          if (medicalProfile) {
            setMedicalData({
              ...medicalProfile,
              allergies: Array.isArray(medicalProfile.allergies) ? medicalProfile.allergies : [],
              medications: Array.isArray(medicalProfile.medications) ? medicalProfile.medications : [],
              conditions: Array.isArray(medicalProfile.conditions) ? medicalProfile.conditions : [],
            });
          }
        } catch (error: any) {
          console.error("Error fetching child:", error);
          toast({
            title: "Error",
            description: "Failed to load child data",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else if (!childId && open) {
        // Reset form for new child
        setFirstName("");
        setLastName("");
        setAge(undefined);
        setEmergencyContactName("");
        setEmergencyContactPhone("");
        setNotes("");
        setCurrentChildParentId(null);
        setMedicalData({
          allergies: [],
          medications: [],
          conditions: [],
          dietary_restrictions: '',
          blood_type: '',
          emergency_notes: '',
          doctor_name: '',
          doctor_phone: '',
          insurance_provider: '',
          insurance_number: ''
        });
        setActiveTab("basic");
      }
    };

    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('id, name').order('name');
      setClasses(data || []);
    };

    fetchChildAndMedicalData();
    fetchClasses();
  }, [childId, user, open, toast]);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !user) {
      toast({
        title: "Error",
        description: !user ? "You must be logged in" : "First and last name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const childPayload = {
        first_name: firstName,
        last_name: lastName,
        age: age,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        notes: notes,
        parent_id: user.id,
        class_id: classId,
        // Sync the main allergies field for legacy compatibility/quick view
        allergies: medicalData.allergies.map((a: any) => a.type).join(', '),
        medical_info: medicalData.emergency_notes
      };

      let currentChildId = childId;

      if (childId) {
        const { error } = await supabase
          .from('children')
          .update(childPayload)
          .eq('id', childId);

        if (error) throw error;
      } else {
        const { data: newChild, error } = await supabase
          .from('children')
          .insert(childPayload)
          .select()
          .single();

        if (error) throw error;
        currentChildId = newChild.id;
      }

      // Save/Upsert Medical Profile
      if (currentChildId) {
        const { error: medicalError } = await (supabase
          .from('child_medical_profiles' as any) as any)
          .upsert({
            ...medicalData,
            child_id: currentChildId,
            updated_at: new Date().toISOString()
          } as any);

        if (medicalError) {
          console.error("Error saving medical profile:", medicalError);
          // Don't fail the whole operation if just the medical profile update fails
          // but toast it
          toast({
            title: "Warning",
            description: "Child saved, but medical profile update had an error.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: `Child ${childId ? "updated" : "added"} successfully!`,
      });

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
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Baby className="h-8 w-8 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{childId ? "Edit Child Profile" : "Register New Child"}</DialogTitle>
              <p className="text-indigo-100 text-sm mt-1">Ensure all information is accurate for child safety.</p>
            </div>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-100 px-8">
            <TabsList className="bg-transparent h-14 gap-8">
              <TabsTrigger
                value="basic"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-semibold"
              >
                <User className="h-4 w-4 mr-2" />
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="medical"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-semibold"
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                Health & Safety
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <TabsContent value="basic" className="mt-0 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age !== undefined ? age.toString() : ""}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    disabled={loading}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Primary Contact Phone</Label>
                  <div className="relative">
                    <Input
                      id="emergencyContactPhone"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      disabled={loading}
                      placeholder="(555) 000-0000"
                      className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="class-assignment" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Classroom Assignment (Admin Only)</Label>
                  <Select value={classId || "none"} onValueChange={(val) => setClassId(val === "none" ? null : val)}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all">
                      <SelectValue placeholder="Assign to a class (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Class / Unassigned</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 italic">Overrides automatic age-based assignment if manually set.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="emergencyContactName" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  disabled={loading}
                  placeholder="Full name of emergency contact"
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">General Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none"
                  placeholder="Any other important information..."
                />
              </div>
            </TabsContent>

            <TabsContent value="medical" className="mt-0 space-y-6 animate-in fade-in duration-300">
              {!canEditHealth && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-xs">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <p>You have view-only access to health information. Only administrators or the child's primary guardian can update these records.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="blood-type" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Blood Type</Label>
                  <Input
                    id="blood-type"
                    value={medicalData.blood_type}
                    onChange={(e) => setMedicalData({ ...medicalData, blood_type: e.target.value })}
                    placeholder="e.g. O+"
                    disabled={!canEditHealth || loading}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="doctor-name" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Primary Doctor</Label>
                  <div className="relative">
                    <Input
                      id="doctor-name"
                      value={medicalData.doctor_name}
                      onChange={(e) => setMedicalData({ ...medicalData, doctor_name: e.target.value })}
                      placeholder="Doctor's full name"
                      disabled={!canEditHealth || loading}
                      className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200"
                    />
                    <Stethoscope className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Structured Allergies */}
              <div className="space-y-3">
                <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider flex items-center gap-2">
                  Allergies
                  <Badge variant="destructive" className="ml-2 text-[8px] h-4">Safety Critical</Badge>
                </Label>

                <div className="space-y-2">
                  {medicalData.allergies.length === 0 ? (
                    <p className="text-slate-400 text-xs italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">No structured allergies listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medicalData.allergies.map((allergy: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-100 group">
                          <span className="text-xs font-bold capitalize">{allergy.type}</span>
                          <span className="text-[10px] bg-red-200/50 px-1.5 rounded">
                            {allergy.severity === 'high' ? 'SEVERE' : allergy.severity}
                          </span>
                          {canEditHealth && (
                            <button
                              onClick={() => {
                                const newAllergies = [...medicalData.allergies];
                                newAllergies.splice(idx, 1);
                                setMedicalData({ ...medicalData, allergies: newAllergies });
                              }}
                              className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canEditHealth && (
                    <div className="flex gap-2 pt-2">
                      <Input
                        id="new-allergy-input"
                        placeholder="Add allergy (e.g. Peanuts)"
                        className="h-9 text-xs rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              setMedicalData({
                                ...medicalData,
                                allergies: [...medicalData.allergies, { type: val, severity: 'moderate' }]
                              });
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-xs gap-1.5 rounded-lg border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => {
                          const input = document.getElementById('new-allergy-input') as HTMLInputElement;
                          if (input.value) {
                            setMedicalData({
                              ...medicalData,
                              allergies: [...medicalData.allergies, { type: input.value, severity: 'moderate' }]
                            });
                            input.value = '';
                          }
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Structured Medications */}
              <div className="space-y-3">
                <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  Medications
                </Label>

                <div className="space-y-2">
                  {medicalData.medications.length === 0 ? (
                    <p className="text-slate-400 text-xs italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">No medications listed</p>
                  ) : (
                    <div className="space-y-2">
                      {medicalData.medications.map((med: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                              <Pill className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-indigo-900">{med.name}</p>
                              <p className="text-[10px] text-indigo-600 uppercase tracking-wider">{med.dosage || 'No dosage info'}</p>
                            </div>
                          </div>
                          {canEditHealth && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const newMeds = [...medicalData.medications];
                                newMeds.splice(idx, 1);
                                setMedicalData({ ...medicalData, medications: newMeds });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canEditHealth && (
                    <div className="flex gap-2 pt-2">
                      <Input
                        id="new-med-input"
                        placeholder="Medication name"
                        className="h-9 text-xs rounded-lg flex-[2]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                      />
                      <Input
                        id="new-med-dose"
                        placeholder="Dosage"
                        className="h-9 text-xs rounded-lg flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-xs gap-1.5 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        onClick={() => {
                          const nameInput = document.getElementById('new-med-input') as HTMLInputElement;
                          const doseInput = document.getElementById('new-med-dose') as HTMLInputElement;
                          if (nameInput.value) {
                            setMedicalData({
                              ...medicalData,
                              medications: [...medicalData.medications, { name: nameInput.value, dosage: doseInput.value }]
                            });
                            nameInput.value = '';
                            doseInput.value = '';
                          }
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider flex items-center gap-2">
                  Emergency & Additional Health Notes
                </Label>
                <Textarea
                  value={medicalData.emergency_notes}
                  onChange={(e) => setMedicalData({ ...medicalData, emergency_notes: e.target.value })}
                  rows={4}
                  disabled={!canEditHealth || loading}
                  className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all resize-none text-slate-800 text-sm"
                  placeholder="Include any specific medical instructions or developmental notes here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="insurance-provider" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Insurance Provider</Label>
                  <Input
                    id="insurance-provider"
                    value={medicalData.insurance_provider}
                    disabled={!canEditHealth || loading}
                    onChange={(e) => setMedicalData({ ...medicalData, insurance_provider: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance-number" className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Policy #</Label>
                  <Input
                    id="insurance-number"
                    value={medicalData.insurance_number}
                    disabled={!canEditHealth || loading}
                    onChange={(e) => setMedicalData({ ...medicalData, insurance_number: e.target.value })}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-8 pt-0 flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all font-bold"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              childId ? "Save Changes" : "Register Child"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditChildDialog;
