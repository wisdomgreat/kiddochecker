
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AccountStep from "@/components/registration/AccountStep";
import PersonalStep from "@/components/registration/PersonalStep";
import ChildrenStep, { ChildFormData } from "@/components/registration/ChildrenStep";
import ReviewStep from "@/components/registration/ReviewStep";
import CompleteStep from "@/components/registration/CompleteStep";
import ProgressBar from "@/components/registration/ProgressBar";

// Parent registration steps
type RegistrationStep = "account" | "personal" | "children" | "review" | "complete";

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Registration step state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("account");
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Account information
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Personal information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  
  // Children information
  const [children, setChildren] = useState<ChildFormData[]>([{
    firstName: "",
    lastName: "",
    birthdate: "",
    allergies: "",
    specialNeeds: "",
    medicalInfo: ""
  }]);
  
  // Form validation
  const validateAccountStep = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return false;
    }
    
    if (pin.length < 6) {
      toast({
        title: "Invalid PIN/Password",
        description: "Your PIN/Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }
    
    if (pin !== confirmPin) {
      toast({
        title: "PINs Do Not Match",
        description: "Your PIN/Password and confirmation do not match",
        variant: "destructive",
      });
      return false;
    }
    
    if (!agreeToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "You must agree to the terms and conditions",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validatePersonalStep = () => {
    if (!firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please provide your first and last name",
        variant: "destructive",
      });
      return false;
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const validateChildrenStep = () => {
    for (const child of children) {
      if (!child.firstName || !child.lastName) {
        toast({
          title: "Missing Child Information",
          description: "Please provide first and last name for each child",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };
  
  // Handle registration submission
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      
      // Generate a fake email from the phone number for authentication
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      
      // Use a proper domain to avoid validation errors
      const fakeEmail = `parent_${cleanedPhone}@churchcheck.org`;
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pin,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: cleanedPhone
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // Create family record
      let familyId = null;
      
      // Using the stored procedure via function call
      try {
        const { data: familyData, error: familyError } = await supabase.rpc("create_organization", {
          org_name: `${lastName} Family`,
          creator_id: authData.user.id
        });
        
        if (familyError) throw familyError;
        familyId = familyData;
      } catch (error) {
        console.error("Error with functions, falling back to direct SQL", error);
        
        // Fallback to direct SQL insert
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .insert({ name: `${lastName} Family` })
          .select('id')
          .single();
          
        if (familyError) throw familyError;
        familyId = familyData.id;
      }
      
      // Create parent profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email || fakeEmail,
          phone: cleanedPhone,
          address,
          emergency_contact: emergencyContact,
          emergency_phone: emergencyPhone
        });
      
      if (profileError) throw profileError;
      
      // Create child records and link to parent
      for (const child of children) {
        const { data: childData, error: childError } = await supabase
          .from('children')
          .insert({
            first_name: child.firstName,
            last_name: child.lastName,
            allergies: child.allergies || null,
            special_needs: child.specialNeeds || null,
            medical_info: child.medicalInfo || null,
            family_id: familyId,
            parent_id: authData.user.id
          })
          .select('id')
          .single();
        
        if (childError) throw childError;
        
        // Link parent to child
        try {
          const { error: linkError } = await supabase.rpc("link_parent_child", {
            p_parent_id: authData.user.id,
            p_child_id: childData.id,
            p_relationship: 'parent'
          });
          
          if (linkError) throw linkError;
        } catch (error) {
          console.error("Error with functions, falling back to direct SQL", error);
          
          // Fallback to direct SQL insert
          const { error: linkError } = await supabase
            .from('parent_children')
            .insert({
              parent_id: authData.user.id,
              child_id: childData.id,
              relationship: 'parent'
            });
            
          if (linkError) throw linkError;
        }
      }
      
      // Registration successful
      toast({
        title: "Registration Successful",
        description: "Your account has been created",
      });
      
      // Move to completion step
      setCurrentStep("complete");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += '(' + cleaned.substring(0, 3);
      if (cleaned.length > 3) {
        formatted += ') ' + cleaned.substring(3, 6);
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, 10);
        }
      }
    }
    
    return formatted.trim();
  };
  
  // Navigation between steps
  const goToNextStep = () => {
    if (currentStep === "account" && validateAccountStep()) {
      setCurrentStep("personal");
    } else if (currentStep === "personal" && validatePersonalStep()) {
      setCurrentStep("children");
    } else if (currentStep === "children" && validateChildrenStep()) {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      handleRegister();
    } else if (currentStep === "complete") {
      navigate("/parent-dashboard");
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep === "personal") {
      setCurrentStep("account");
    } else if (currentStep === "children") {
      setCurrentStep("personal");
    } else if (currentStep === "review") {
      setCurrentStep("children");
    }
  };
  
  // Child form management
  const handleAddChild = () => {
    setChildren([...children, {
      firstName: "",
      lastName: "",
      birthdate: "",
      allergies: "",
      specialNeeds: "",
      medicalInfo: ""
    }]);
  };
  
  const handleRemoveChild = (index: number) => {
    if (children.length > 1) {
      const updatedChildren = [...children];
      updatedChildren.splice(index, 1);
      setChildren(updatedChildren);
    }
  };
  
  const handleChildFormChange = (index: number, field: keyof ChildFormData, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "account":
        return (
          <AccountStep
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            pin={pin}
            setPin={setPin}
            confirmPin={confirmPin}
            setConfirmPin={setConfirmPin}
            agreeToTerms={agreeToTerms}
            setAgreeToTerms={setAgreeToTerms}
            formatPhoneNumber={formatPhoneNumber}
          />
        );
      case "personal":
        return (
          <PersonalStep
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            address={address}
            setAddress={setAddress}
            emergencyContact={emergencyContact}
            setEmergencyContact={setEmergencyContact}
            emergencyPhone={emergencyPhone}
            setEmergencyPhone={setEmergencyPhone}
            formatPhoneNumber={formatPhoneNumber}
          />
        );
      case "children":
        return (
          <ChildrenStep
            children={children}
            handleAddChild={handleAddChild}
            handleRemoveChild={handleRemoveChild}
            handleChildFormChange={handleChildFormChange}
          />
        );
      case "review":
        return (
          <ReviewStep
            phoneNumber={phoneNumber}
            firstName={firstName}
            lastName={lastName}
            email={email}
            address={address}
            emergencyContact={emergencyContact}
            emergencyPhone={emergencyPhone}
            children={children}
          />
        );
      case "complete":
        return <CompleteStep />;
      default:
        return null;
    }
  };
  
  // Main render method
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <ProgressBar currentStep={currentStep} />
          
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {renderCurrentStep()}
              
              {/* Navigation buttons */}
              {currentStep !== "complete" && (
                <div className="flex justify-between mt-8">
                  {currentStep !== "account" && (
                    <Button 
                      variant="outline" 
                      onClick={goToPreviousStep}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  )}
                  
                  <div className={currentStep === "account" ? "ml-auto" : ""}>
                    <Button 
                      onClick={goToNextStep}
                      disabled={isLoading}
                    >
                      {currentStep === "review" ? "Submit Registration" : "Continue"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentRegistration;
