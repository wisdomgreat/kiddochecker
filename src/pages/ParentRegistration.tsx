import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChildRegistrationForm from "@/components/check-in/ChildRegistrationForm";
import { ChildFormData } from "@/components/check-in/ChildRegistrationForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronLeft, ChevronRight, User } from "lucide-react";

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Parent info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  
  // Family info
  const [familyName, setFamilyName] = useState("");
  
  // Children info
  const [children, setChildren] = useState<ChildFormData[]>([]);
  const [currentChild, setCurrentChild] = useState<ChildFormData>({
    firstName: "",
    lastName: "",
    age: "",
    allergies: "",
    medicalInfo: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
  });
  
  // Handle phone number format
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
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
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setPhoneNumber(formattedValue);
  };
  
  const addChild = (childData: ChildFormData) => {
    setChildren([...children, childData]);
    setCurrentChild({
      firstName: "",
      lastName: "",
      age: "",
      allergies: "",
      medicalInfo: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    });
  };
  
  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          firstName.trim() &&
          lastName.trim() &&
          phoneNumber.replace(/\D/g, '').length === 10
        );
      case 2:
        return (
          pin.length === 4 &&
          confirmPin.length === 4 &&
          pin === confirmPin &&
          securityQuestion.trim() &&
          securityAnswer.trim()
        );
      case 3:
        return familyName.trim() !== '';
      case 4:
        // If we have at least one child OR the current child form is valid
        return children.length > 0 || (
          currentChild.firstName.trim() &&
          currentChild.lastName.trim() &&
          currentChild.age.trim()
        );
      default:
        return false;
    }
  };
  
  // Function to create a family and return the family ID
  const createFamily = async (name: string): Promise<string> => {
    try {
      // First try to use the RPC
      const { data, error } = await supabase.rpc('create_family', {
        family_name: name
      });
      
      if (error) throw error;
      return data;
    } catch (rpcError) {
      console.error("RPC error, falling back to direct SQL:", rpcError);
      
      // Fall back to direct SQL insert if RPC fails
      const { data, error } = await supabase
        .from('families')
        .insert({ name: name })
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id;
    }
  };
  
  // Function to link parent to child
  const linkParentChild = async (parentId: string, childId: string, relationship: string) => {
    try {
      // First try to use the RPC
      const { data, error } = await supabase.rpc('link_parent_child', {
        p_parent_id: parentId,
        p_child_id: childId,
        p_relationship: relationship
      });
      
      if (error) throw error;
      return data;
    } catch (rpcError) {
      console.error("RPC error, falling back to direct SQL:", rpcError);
      
      // Fall back to direct SQL insert if RPC fails
      const { error } = await supabase
        .from('parent_children')
        .insert({
          parent_id: parentId,
          child_id: childId,
          relationship: relationship
        });
        
      if (error) throw error;
    }
  };
  
  const handleRegistration = async () => {
    try {
      setLoading(true);
      
      // Create fake email from phone number for auth
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const fakeEmail = `${phoneDigits}@example.com`;
      
      // 1. Register the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pin,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
          },
        },
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // 2. Update user profile with security question
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          security_question: securityQuestion,
          security_answer: securityAnswer
        })
        .eq('id', authData.user.id);
        
      if (profileError) throw profileError;
      
      // 3. Create family
      const familyId = await createFamily(familyName);
      
      // 4. Register children
      const allChildren = [...children];
      
      // Add current child if it has data
      if (currentChild.firstName && currentChild.lastName) {
        allChildren.push(currentChild);
      }
      
      // Process all children
      for (const child of allChildren) {
        // Create child record
        const { data: childData, error: childError } = await supabase
          .from('children')
          .insert({
            first_name: child.firstName,
            last_name: child.lastName,
            age: parseInt(child.age) || null,
            allergies: child.allergies || null,
            medical_info: child.medicalInfo || null,
            emergency_contact_name: child.emergencyContactName || null,
            emergency_contact_phone: child.emergencyContactPhone || null,
            notes: child.notes || null,
            parent_id: authData.user.id,
            family_id: familyId
          })
          .select('id')
          .single();
          
        if (childError) throw childError;
        
        // Link parent to child
        await linkParentChild(
          authData.user.id,
          childData.id,
          'Parent'
        );
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created. You can now check in your children.",
      });
      
      // Navigate to parent dashboard
      navigate("/parent-dashboard");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleRegistration();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/check-in-kiosk");
    }
  };
  
  const handleFinish = () => {
    if (currentChild.firstName && currentChild.lastName) {
      addChild(currentChild);
    }
    handleRegistration();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Parent Registration</h1>
        <p className="text-gray-600">Create an account to check in your children</p>
      </div>
      
      <div className="w-full max-w-2xl bg-slate-50/90 border-0 shadow-sm rounded-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-semibold">Step {step} of 4</h2>
              <p className="text-sm text-gray-500">Complete all steps to register</p>
            </div>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}>
            {step === 1 && (
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">Parent Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-base font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-white text-base py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-base font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-white text-base py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="bg-white text-base py-2"
                  />
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">Account Security</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-base font-medium">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter a 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="bg-white text-base py-2"
                    maxLength={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPin" className="text-base font-medium">Confirm PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    placeholder="Confirm your PIN"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="bg-white text-base py-2"
                    maxLength={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="securityQuestion" className="text-base font-medium">Security Question</Label>
                  <Input
                    id="securityQuestion"
                    type="text"
                    placeholder="Enter a security question"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="bg-white text-base py-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="securityAnswer" className="text-base font-medium">Security Answer</Label>
                  <Input
                    id="securityAnswer"
                    type="text"
                    placeholder="Enter the answer to your security question"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="bg-white text-base py-2"
                  />
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">Family Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="familyName" className="text-base font-medium">Family Name</Label>
                  <Input
                    id="familyName"
                    type="text"
                    placeholder="Enter your family name"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="bg-white text-base py-2"
                  />
                </div>
              </div>
            )}
            
            {step === 4 && (
              <div className="space-y-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">Children Information</h3>
                
                {children.map((child, index) => (
                  <div key={index} className="p-4 border rounded-md bg-gray-50">
                    <h4 className="font-medium">Child #{index + 1}</h4>
                    <p className="text-sm text-gray-500">
                      {child.firstName} {child.lastName}, Age: {child.age}
                    </p>
                  </div>
                ))}
                
                <h4 className="font-medium mt-4">Add a Child</h4>
                <ChildRegistrationForm
                  childData={currentChild}
                  onChange={(field, value) => setCurrentChild({ ...currentChild, [field]: value })}
                />
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {step === 4 ? (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleFinish}
                  disabled={!isStepValid() || loading}
                >
                  {loading ? "Registering..." : (
                    <>
                      Finish Registration
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  type="submit"
                  disabled={!isStepValid() || loading}
                >
                  {loading ? "Please wait..." : (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <div className="w-full max-w-2xl mt-6 text-center">
        <Button variant="ghost" onClick={() => navigate("/check-in-kiosk")}>
          Already have an account? Login
        </Button>
      </div>
    </div>
  );
};

export default ParentRegistration;
