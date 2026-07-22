import { Badge } from "@/components/ui/badge";
import { User, Baby, ShieldCheck, Mail, Phone, MapPin, AlertTriangle } from "lucide-react";

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
  children: Array<{
    firstName: string;
    lastName: string;
    birthdate: string;
    allergies: string;
    medicalInfo: string;
    notes: string;
  }>;
}

export const ReviewStep = ({ parentData, children }: ReviewStepProps) => {
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
        <h3 className="text-lg font-bold text-foreground">Review Information</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Double check all details before submitting registration.</p>
      </div>

      {/* Parent Information Summary */}
      <div className="border border-border/70 rounded-2xl p-6 bg-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <User className="h-4 w-4 text-primary" />
          <h4 className="font-bold text-sm text-foreground">Parent Details</h4>
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
              <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Address</span>
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
        <div className="space-y-3">
          {children.map((child, index) => (
            <div key={index} className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{child.firstName} {child.lastName}</span>
                <Badge variant="secondary" className="font-bold text-[10px]">
                  Age: {calculateAge(child.birthdate)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Date of Birth: <span className="text-foreground font-medium">{child.birthdate}</span></p>
                {child.allergies && (
                  <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Allergies: {child.allergies}
                  </p>
                )}
                {child.medicalInfo && <p>Medical: <span className="text-foreground font-medium">{child.medicalInfo}</span></p>}
                {child.notes && <p>Notes: <span className="text-foreground font-medium">{child.notes}</span></p>}
              </div>
            </div>
          ))}
        </div>
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
