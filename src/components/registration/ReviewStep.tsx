import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  User, Baby, ShieldCheck, Mail, Phone, MapPin, 
  AlertTriangle, Stethoscope, Pill, ShieldAlert, FileText, Check 
} from "lucide-react";
import { ChildData } from "./ChildrenRegistrationStep";

interface ReviewStepProps {
  parentData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  children: ChildData[];
  consentAgreed?: boolean;
  onConsentChange?: (agreed: boolean) => void;
}

export const ReviewStep = ({ parentData, children, consentAgreed = false, onConsentChange }: ReviewStepProps) => {
  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Review Information & Consent</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Please verify all submitted family, health, and emergency details before completing registration.</p>
      </div>

      {/* Parent Information Summary */}
      <div className="border border-border/70 rounded-2xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <User className="h-4 w-4 text-primary" />
          <h4 className="font-bold text-sm text-foreground">Parent / Guardian Details</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Full Name</span>
            <span className="font-semibold text-foreground text-sm">{parentData.firstName} {parentData.lastName}</span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Email Address</span>
            <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {parentData.email}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Phone Number</span>
            <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {parentData.phone}
            </span>
          </div>
          {parentData.address && (
            <div>
              <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Home Address</span>
              <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {parentData.address}
              </span>
            </div>
          )}
          {parentData.emergencyContact && (
            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-border/30">
              <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Emergency Contact</span>
              <span className="font-semibold text-foreground">{parentData.emergencyContact} ({parentData.emergencyPhone})</span>
            </div>
          )}
        </div>
      </div>

      {/* Children Information Summary */}
      <div className="border border-border/70 rounded-2xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Baby className="h-4 w-4 text-primary" />
          <h4 className="font-bold text-sm text-foreground">Registered Children ({children.length})</h4>
        </div>
        <div className="space-y-4">
          {children.map((child, index) => (
            <div key={index} className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{child.firstName} {child.lastName}</span>
                <div className="flex items-center gap-1.5">
                  {child.bloodType && (
                    <Badge variant="outline" className="font-bold text-[10px] bg-rose-500/10 text-rose-600 border-rose-200">
                      Blood: {child.bloodType}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="font-bold text-[10px]">
                    Age: {calculateAge(child.birthdate)}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>Date of Birth: <span className="text-foreground font-medium">{child.birthdate}</span></p>

                {child.allergies && (
                  <p className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Allergies: {child.allergies}
                  </p>
                )}

                {child.structuredConditions && child.structuredConditions.length > 0 && (
                  <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Stethoscope className="h-3.5 w-3.5" /> Health Conditions: {child.structuredConditions.join(', ')}
                  </p>
                )}

                {child.structuredMedications && child.structuredMedications.length > 0 && (
                  <p className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Pill className="h-3.5 w-3.5" /> Medications: {child.structuredMedications.map(m => `${m.name} (${m.dosage})`).join(', ')}
                  </p>
                )}

                {child.doctorName && (
                  <p>Primary Doctor: <span className="text-foreground font-medium">{child.doctorName} ({child.doctorPhone || 'No phone provided'})</span></p>
                )}

                {child.insuranceProvider && (
                  <p>Insurance: <span className="text-foreground font-medium">{child.insuranceProvider} {child.insuranceNumber ? `(Policy #${child.insuranceNumber})` : ''}</span></p>
                )}

                {child.authorizedPickups && (
                  <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> Authorized Pickups: {child.authorizedPickups}
                  </p>
                )}

                {child.medicalInfo && (
                  <p>Medical / Care Notes: <span className="text-foreground font-medium">{child.medicalInfo}</span></p>
                )}

                {child.notes && (
                  <p>General Notes: <span className="text-foreground font-medium">{child.notes}</span></p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explicit Parental Consent & Terms Checkbox */}
      <div className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="parentConsent"
            checked={consentAgreed}
            onCheckedChange={(checked) => onConsentChange && onConsentChange(Boolean(checked))}
            className="mt-1"
          />
          <Label htmlFor="parentConsent" className="text-xs leading-relaxed text-foreground cursor-pointer">
            <span className="font-bold text-sm block mb-1">
              Parental Consent & Policy Agreement <span className="text-rose-500">*</span>
            </span>
            I certify that I am the parent or legal guardian of the child(ren) listed above. I have read and agree to the{" "}
            <Link to="/terms-of-service" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-bold underline">
              Privacy Policy
            </Link>
            . I explicitly consent to the collection, storage, and emergency medical use of the provided health alerts and attendance information for child protection.
          </Label>
        </div>

        {!consentAgreed && (
          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 pl-7 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> You must review and agree to the terms and privacy statement to complete registration.
          </p>
        )}
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
        <p className="font-bold text-primary flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" /> Ready to complete registration
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Submitting will create your account and child profiles immediately. You can start managing check-ins right away.
        </p>
      </div>
    </div>
  );
};

export default ReviewStep;
