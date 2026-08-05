import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Baby, Stethoscope, Heart, ShieldAlert, Pill, ChevronDown, ChevronUp, AlertCircle, X } from "lucide-react";

export interface AllergyItem {
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency?: string;
}

export interface ChildData {
  firstName: string;
  lastName: string;
  birthdate: string;
  age: number;
  allergies: string;
  medicalInfo: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Structured Medical Fields
  bloodType?: string;
  doctorName?: string;
  doctorPhone?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  structuredAllergies?: AllergyItem[];
  structuredMedications?: MedicationItem[];
  structuredConditions?: string[];
}

interface ChildrenRegistrationStepProps {
  children: ChildData[];
  onChange: (children: ChildData[]) => void;
}

const COMMON_ALLERGIES = ["Peanuts", "Tree Nuts", "Dairy / Milk", "Eggs", "Gluten / Wheat", "Soy", "Shellfish", "Fish", "Latex", "Penicillin", "Bee / Insect Stings"];
const COMMON_CONDITIONS = ["Asthma", "Diabetes (Type 1)", "Epilepsy / Seizures", "ADHD / ADD", "Autism Spectrum", "Heart Condition", "Severe Eczema"];

export const ChildrenRegistrationStep: React.FC<ChildrenRegistrationStepProps> = ({ children, onChange }) => {
  const [expandedMedical, setExpandedMedical] = useState<Record<number, boolean>>({});
  const [customAllergyInput, setCustomAllergyInput] = useState<Record<number, string>>({});
  const [customConditionInput, setCustomConditionInput] = useState<Record<number, string>>({});
  const [newMedName, setNewMedName] = useState<Record<number, string>>({});
  const [newMedDosage, setNewMedDosage] = useState<Record<number, string>>({});

  const toggleMedicalSection = (index: number) => {
    setExpandedMedical((prev) => ({ ...prev, [index]: !prev[index] }));
  };

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
      emergencyContactPhone: "",
      bloodType: "",
      doctorName: "",
      doctorPhone: "",
      insuranceProvider: "",
      insuranceNumber: "",
      structuredAllergies: [],
      structuredMedications: [],
      structuredConditions: []
    };
    onChange([...children, newChild]);
    // Expand medical section by default for the new child
    setExpandedMedical((prev) => ({ ...prev, [children.length]: true }));
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      const updatedChildren = children.filter((_, i) => i !== index);
      onChange(updatedChildren);
    }
  };

  const updateChild = (index: number, field: keyof ChildData, value: any) => {
    const updatedChildren = children.map((child, i) =>
      i === index ? { ...child, [field]: value } : child
    );
    onChange(updatedChildren);
  };

  const updateChildFields = (index: number, fields: Partial<ChildData>) => {
    const updatedChildren = children.map((child, i) =>
      i === index ? { ...child, ...fields } : child
    );
    onChange(updatedChildren);
  };

  // ─── Allergy Management ───────────────────────────────────────────────────
  const addAllergy = (index: number, typeName: string, severity: 'mild' | 'moderate' | 'severe' = 'moderate') => {
    if (!typeName.trim()) return;
    const current = children[index].structuredAllergies || [];
    if (current.some((a) => a.type.toLowerCase() === typeName.toLowerCase())) return;

    const updated = [...current, { type: typeName.trim(), severity }];
    const summaryText = updated.map((a) => `${a.type} (${a.severity})`).join(', ');
    updateChildFields(index, { structuredAllergies: updated, allergies: summaryText });
  };

  const removeAllergy = (index: number, typeName: string) => {
    const current = children[index].structuredAllergies || [];
    const updated = current.filter((a) => a.type.toLowerCase() !== typeName.toLowerCase());
    const summaryText = updated.map((a) => `${a.type} (${a.severity})`).join(', ');
    updateChildFields(index, { structuredAllergies: updated, allergies: summaryText });
  };

  // ─── Condition Management ─────────────────────────────────────────────────
  const toggleCondition = (index: number, conditionName: string) => {
    const current = children[index].structuredConditions || [];
    let updated: string[];
    if (current.includes(conditionName)) {
      updated = current.filter((c) => c !== conditionName);
    } else {
      updated = [...current, conditionName];
    }
    updateChild(index, 'structuredConditions', updated);
  };

  // ─── Medication Management ────────────────────────────────────────────────
  const addMedication = (index: number) => {
    const name = (newMedName[index] || '').trim();
    const dosage = (newMedDosage[index] || '').trim();
    if (!name) return;

    const current = children[index].structuredMedications || [];
    const updated = [...current, { name, dosage }];
    updateChild(index, 'structuredMedications', updated);

    setNewMedName((prev) => ({ ...prev, [index]: '' }));
    setNewMedDosage((prev) => ({ ...prev, [index]: '' }));
  };

  const removeMedication = (index: number, medIndex: number) => {
    const current = children[index].structuredMedications || [];
    const updated = current.filter((_, i) => i !== medIndex);
    updateChild(index, 'structuredMedications', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Children Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add children who will be checking in to your facility.
          </p>
        </div>
        <Button
          type="button"
          onClick={addChild}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl text-xs font-bold uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 text-primary" />
          Add Another Child
        </Button>
      </div>

      {children.map((child, index) => {
        const isMedicalOpen = expandedMedical[index] ?? false;
        const allergies = child.structuredAllergies || [];
        const conditions = child.structuredConditions || [];
        const medications = child.structuredMedications || [];

        return (
          <div key={index} className="p-6 border border-border/60 rounded-2xl bg-card/50 shadow-sm space-y-6">
            {/* Child Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Baby className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">
                    Child {index + 1}: {child.firstName ? `${child.firstName} ${child.lastName}` : "New Child"}
                  </h4>
                  {allergies.length > 0 || conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {allergies.map((a, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-500/10 text-rose-600 border-rose-200">
                          ⚠️ {a.type} ({a.severity})
                        </Badge>
                      ))}
                      {conditions.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-200">
                          🩺 {c}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              {children.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeChild(index)}
                  variant="ghost"
                  size="sm"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-3 rounded-lg text-xs font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</Label>
                <Input
                  value={child.firstName}
                  onChange={(e) => updateChild(index, "firstName", e.target.value)}
                  placeholder="Child's first name"
                  className="h-10 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</Label>
                <Input
                  value={child.lastName}
                  onChange={(e) => updateChild(index, "lastName", e.target.value)}
                  placeholder="Child's last name"
                  className="h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of Birth *</Label>
                <Input
                  type="date"
                  value={child.birthdate}
                  onChange={(e) => updateChild(index, "birthdate", e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Type (Optional)</Label>
                <Select
                  value={child.bloodType || ""}
                  onValueChange={(val) => updateChild(index, "bloodType", val)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select Blood Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A Positive (A+)</SelectItem>
                    <SelectItem value="A-">A Negative (A-)</SelectItem>
                    <SelectItem value="B+">B Positive (B+)</SelectItem>
                    <SelectItem value="B-">B Negative (B-)</SelectItem>
                    <SelectItem value="O+">O Positive (O+)</SelectItem>
                    <SelectItem value="O-">O Negative (O-)</SelectItem>
                    <SelectItem value="AB+">AB Positive (AB+)</SelectItem>
                    <SelectItem value="AB-">AB Negative (AB-)</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Structured Medical Section Accordion */}
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-background">
              <button
                type="button"
                onClick={() => toggleMedicalSection(index)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground flex items-center gap-2">
                      Medical Profile & Health Alerts
                      {allergies.length > 0 || conditions.length > 0 || medications.length > 0 ? (
                        <Badge className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] px-2 py-0">
                          {allergies.length + conditions.length + medications.length} Alert(s) Added
                        </Badge>
                      ) : (
                        <span className="text-xs font-normal text-muted-foreground">(Optional - Click to expand)</span>
                      )}
                    </span>
                    <p className="text-[11px] text-muted-foreground">Allergies, chronic conditions, medications, doctor & insurance info</p>
                  </div>
                </div>
                {isMedicalOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>

              {isMedicalOpen && (
                <div className="p-5 space-y-6 border-t border-border/60 bg-card">
                  {/* 1. Allergies */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-500" />
                      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Allergies & Sensitivities</Label>
                    </div>

                    {/* Active Allergy Badges */}
                    {allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                        {allergies.map((a, aIdx) => (
                          <Badge
                            key={aIdx}
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg ${
                              a.severity === 'severe'
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : a.severity === 'moderate'
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-slate-700 text-white hover:bg-slate-800'
                            }`}
                          >
                            <span>{a.type}</span>
                            <span className="opacity-80 text-[10px] uppercase font-mono">({a.severity})</span>
                            <button
                              type="button"
                              onClick={() => removeAllergy(index, a.type)}
                              className="ml-1 hover:text-rose-200 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Allergy Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">Quick Select Common Allergies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_ALLERGIES.map((item) => {
                          const isAdded = allergies.some((a) => a.type.toLowerCase() === item.toLowerCase());
                          return (
                            <Button
                              key={item}
                              type="button"
                              variant={isAdded ? "default" : "outline"}
                              size="sm"
                              onClick={() => (isAdded ? removeAllergy(index, item) : addAllergy(index, item, 'moderate'))}
                              className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
                                isAdded
                                  ? 'bg-rose-500 hover:bg-rose-600 text-white font-semibold'
                                  : 'hover:border-rose-300 hover:text-rose-600'
                              }`}
                            >
                              {isAdded ? "✓ " : "+ "}{item}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Allergy Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom allergy (e.g. Antibiotics, Pollen)"
                        value={customAllergyInput[index] || ""}
                        onChange={(e) => setCustomAllergyInput((prev) => ({ ...prev, [index]: e.target.value }))}
                        className="h-9 text-xs rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customAllergyInput[index]) {
                              addAllergy(index, customAllergyInput[index], 'moderate');
                              setCustomAllergyInput((prev) => ({ ...prev, [index]: '' }));
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (customAllergyInput[index]) {
                            addAllergy(index, customAllergyInput[index], 'moderate');
                            setCustomAllergyInput((prev) => ({ ...prev, [index]: '' }));
                          }
                        }}
                        className="h-9 px-3 text-xs rounded-xl font-bold"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* 2. Medical Conditions */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-amber-500" />
                      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Chronic Conditions & Health Notes</Label>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_CONDITIONS.map((cond) => {
                        const isSelected = conditions.includes(cond);
                        return (
                          <Button
                            key={cond}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCondition(index, cond)}
                            className={`h-7 px-2.5 text-xs rounded-lg transition-all ${
                              isSelected
                                ? 'bg-amber-500 hover:bg-amber-600 text-white font-semibold'
                                : 'hover:border-amber-300 hover:text-amber-600'
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}{cond}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Medications */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-blue-500" />
                      <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Current Medications (If any)</Label>
                    </div>

                    {medications.length > 0 && (
                      <div className="space-y-1.5">
                        {medications.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-xl border border-border/40 text-xs">
                            <span className="font-semibold text-foreground">💊 {m.name} {m.dosage ? `— ${m.dosage}` : ''}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedication(index, mIdx)}
                              className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <Input
                        placeholder="Medication Name (e.g. EpiPen)"
                        value={newMedName[index] || ""}
                        onChange={(e) => setNewMedName((prev) => ({ ...prev, [index]: e.target.value }))}
                        className="sm:col-span-3 h-9 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Dosage (e.g. 0.15mg)"
                        value={newMedDosage[index] || ""}
                        onChange={(e) => setNewMedDosage((prev) => ({ ...prev, [index]: e.target.value }))}
                        className="sm:col-span-1 h-9 text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => addMedication(index)}
                        className="sm:col-span-1 h-9 text-xs rounded-xl font-bold"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* 4. Physician & Insurance Details */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Primary Physician & Insurance (Emergency Info)</Label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Doctor / Pediatrician Name"
                        value={child.doctorName || ""}
                        onChange={(e) => updateChild(index, "doctorName", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Doctor Phone Number"
                        value={child.doctorPhone || ""}
                        onChange={(e) => updateChild(index, "doctorPhone", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Insurance Provider (e.g. BlueCross)"
                        value={child.insuranceProvider || ""}
                        onChange={(e) => updateChild(index, "insuranceProvider", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                      <Input
                        placeholder="Insurance Policy / Member ID"
                        value={child.insuranceNumber || ""}
                        onChange={(e) => updateChild(index, "insuranceNumber", e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  {/* 5. Special Medical Notes */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground">Additional Special Care Instructions</Label>
                    <Textarea
                      value={child.medicalInfo || ""}
                      onChange={(e) => updateChild(index, "medicalInfo", e.target.value)}
                      placeholder="Any extra instructions for volunteers or Sunday School teachers during check-in..."
                      rows={2}
                      className="rounded-xl resize-none text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* General Care Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General Care & Behavioral Notes (Optional)</Label>
              <Textarea
                value={child.notes}
                onChange={(e) => updateChild(index, "notes", e.target.value)}
                placeholder="Comfort items, favorite activities, or pickup instructions..."
                rows={2}
                className="rounded-xl resize-none text-xs"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
