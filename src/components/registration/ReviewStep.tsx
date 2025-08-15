
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Review Your Information</h3>
      
      {/* Parent Information */}
      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Name:</strong> {parentData.firstName} {parentData.lastName}</div>
          <div><strong>Email:</strong> {parentData.email}</div>
          <div><strong>Phone:</strong> {parentData.phone}</div>
          {parentData.address && <div><strong>Address:</strong> {parentData.address}</div>}
          {parentData.emergencyContact && (
            <div><strong>Emergency Contact:</strong> {parentData.emergencyContact} ({parentData.emergencyPhone})</div>
          )}
        </CardContent>
      </Card>

      {/* Children Information */}
      <Card>
        <CardHeader>
          <CardTitle>Children Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children.map((child, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{child.firstName} {child.lastName}</h4>
                <Badge variant="outline">Age: {calculateAge(child.birthdate)}</Badge>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Date of Birth:</strong> {new Date(child.birthdate).toLocaleDateString()}</div>
                {child.allergies && <div><strong>Allergies:</strong> {child.allergies}</div>}
                {child.medicalInfo && <div><strong>Medical Info:</strong> {child.medicalInfo}</div>}
                {child.notes && <div><strong>Notes:</strong> {child.notes}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Next Steps:</strong> After submitting your registration, you'll receive an email to verify your account. 
          Once verified, you can log in and start using the check-in system for your children.
        </p>
      </div>
    </div>
  );
};
