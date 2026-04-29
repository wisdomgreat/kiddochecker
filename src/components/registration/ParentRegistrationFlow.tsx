
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { AccountSetupStep } from "./AccountSetupStep";
import { ChildrenRegistrationStep } from "./ChildrenRegistrationStep";
import { ReviewStep } from "./ReviewStep";
import { UserPlus, ArrowLeft, ArrowRight, Check } from "lucide-react";

interface ParentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  password: string;
  confirmPassword: string;
}

interface ChildData {
  firstName: string;
  lastName: string;
  birthdate: string;
  age: number;
  allergies: string;
  medicalInfo: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export const ParentRegistrationFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [parentData, setParentData] = useState<ParentData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    password: "",
    confirmPassword: ""
  });

  const [children, setChildren] = useState<ChildData[]>([{
    firstName: "",
    lastName: "",
    birthdate: "",
    age: 0,
    allergies: "",
    medicalInfo: "",
    notes: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  }]);

  const steps = [
    { title: "Personal Information", icon: UserPlus },
    { title: "Account Setup", icon: UserPlus },
    { title: "Children Information", icon: UserPlus },
    { title: "Review & Submit", icon: Check }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(parentData.firstName && parentData.lastName && parentData.email && parentData.phone);
      case 2:
        return !!(parentData.password && parentData.confirmPassword && parentData.password === parentData.confirmPassword && parentData.password.length >= 6);
      case 3:
        return children.every(child => child.firstName && child.lastName && child.birthdate);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sign up the parent
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: parentData.email,
        password: parentData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/parent-dashboard`,
          data: {
            first_name: parentData.firstName,
            last_name: parentData.lastName,
            phone: parentData.phone
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          address: parentData.address,
          first_name: parentData.firstName,
          last_name: parentData.lastName,
          phone: parentData.phone
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Register children
      for (const child of children) {
        const childAge = calculateAge(child.birthdate);
        
        const { error: childError } = await supabase
          .from('children')
          .insert({
            parent_id: authData.user.id,
            first_name: child.firstName,
            last_name: child.lastName,
            age: childAge,
            allergies: child.allergies || null,
            medical_info: child.medicalInfo || null,
            notes: child.notes || null,
            emergency_contact_name: child.emergencyContactName || parentData.emergencyContact,
            emergency_contact_phone: child.emergencyContactPhone || parentData.emergencyPhone
          });

        if (childError) {
          console.error('Child registration error:', childError);
          throw new Error(`Failed to register child: ${child.firstName}`);
        }
      }

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please check your email to verify your account.",
      });

      navigate('/login');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={parentData}
            onChange={setParentData}
          />
        );
      case 2:
        return (
          <AccountSetupStep
            data={parentData}
            onChange={setParentData}
          />
        );
      case 3:
        return (
          <ChildrenRegistrationStep
            children={children}
            onChange={setChildren}
          />
        );
      case 4:
        return (
          <ReviewStep
            parentData={parentData}
            children={children}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/landing')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Parent Registration</CardTitle>
            
            {/* Progress Steps */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep;
                  
                  return (
                    <div key={stepNumber} className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2 
                        ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                          isActive ? 'bg-blue-500 border-blue-500 text-white' : 
                          'bg-gray-200 border-gray-300 text-gray-500'}
                      `}>
                        {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                      </div>
                      <div className="ml-2 text-sm">
                        <div className={isActive ? 'font-semibold' : 'text-gray-500'}>
                          {step.title}
                        </div>
                      </div>
                      {stepNumber < steps.length && (
                        <div className={`w-12 h-0.5 ml-4 ${stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

