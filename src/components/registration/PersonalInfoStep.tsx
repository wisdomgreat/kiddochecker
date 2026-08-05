import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalInfoStepProps {
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  onChange: (data: any) => void;
}

export const PersonalInfoStep = ({ data, onChange }: PersonalInfoStepProps) => {
  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Please provide your primary contact information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="John"
            className="h-10 rounded-xl"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Doe"
            className="h-10 rounded-xl"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            className="h-10 rounded-xl"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(555) 000-0000"
            className="h-10 rounded-xl"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Home Address</Label>
        <Textarea
          id="address"
          value={data.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main St, Apt 4B, City, State"
          rows={3}
          className="rounded-xl resize-none text-xs"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact Name</Label>
          <Input
            id="emergencyContact"
            value={data.emergencyContact}
            onChange={(e) => handleChange('emergencyContact', e.target.value)}
            placeholder="Jane Doe"
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="emergencyPhone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Phone</Label>
          <Input
            id="emergencyPhone"
            type="tel"
            value={data.emergencyPhone}
            onChange={(e) => handleChange('emergencyPhone', e.target.value)}
            placeholder="(555) 999-9999"
            className="h-10 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
