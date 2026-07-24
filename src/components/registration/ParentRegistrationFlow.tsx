import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { AccountSetupStep } from "./AccountSetupStep";
import { ChildrenRegistrationStep } from "./ChildrenRegistrationStep";
import { ReviewStep } from "./ReviewStep";
import { User, Lock, Baby, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();
  const isEs = language === 'es';
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
    { number: 1, title: isEs ? "Datos Personales" : "Personal Details", icon: User },
    { number: 2, title: isEs ? "Contraseña" : "Account Password", icon: Lock },
    { number: 3, title: isEs ? "Registrar Niños" : "Register Children", icon: Baby },
    { number: 4, title: isEs ? "Revisar y Confirmar" : "Review & Confirm", icon: CheckCircle2 }
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
        title: isEs ? "Complete los campos requeridos" : "Please complete required fields",
        description: isEs ? "Complete toda la información requerida antes de continuar." : "Fill in all required information before proceeding to the next step.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: parentData.firstName,
            last_name: parentData.lastName,
            phone: parentData.phone,
            role: 'parent'
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
          phone: parentData.phone,
          role: 'parent'
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
        title: "Registration Complete!",
        description: "Your account has been created. You can now log in.",
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
        return <PersonalInfoStep data={parentData} onChange={setParentData} />;
      case 2:
        return <AccountSetupStep data={parentData} onChange={setParentData} />;
      case 3:
        return <ChildrenRegistrationStep children={children} onChange={setChildren} />;
      case 4:
        return <ReviewStep parentData={parentData} children={children} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header navigation bar */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/landing')}
            className="gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">KiddoChecker Parent Portal</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Create Parent Account
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Register your family to enable secure check-ins, medical alerts, and instant communication.
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-sm">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div 
                key={step.number}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  isActive && "bg-primary/10 text-primary font-semibold",
                  isCompleted && "text-foreground",
                  !isActive && !isCompleted && "text-muted-foreground opacity-60"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-emerald-500 text-white",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                    Step 0{step.number}
                  </p>
                  <p className="text-xs truncate font-medium mt-0.5">
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form Content Card */}
        <Card className="border border-border/70 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-6 sm:p-10">
            {renderStepContent()}

            {/* Step Controls */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider px-6"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2 rounded-xl text-xs font-semibold uppercase tracking-wider px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Already have an account prompt */}
        <p className="text-center text-xs text-muted-foreground">
          Already registered?{" "}
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="text-primary font-bold hover:underline"
          >
            Sign in to your account
          </button>
        </p>

      </div>
    </div>
  );
};
