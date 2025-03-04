
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ChildRegistrationForm from "@/components/check-in/ChildRegistrationForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define childFormData interface
interface ChildFormData {
  firstName: string;
  lastName: string;
  birthdate: string;
  allergies: string;
  specialNeeds: string;
  medicalInfo: string;
}

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
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return false;
    }
    
    if (pin !== confirmPin) {
      toast({
        title: "PINs Do Not Match",
        description: "Your PIN and confirmation PIN do not match",
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
      const fakeEmail = `${cleanedPhone}@example.com`;
      
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pin,
      });
      
      if (authError) throw authError;
      
      // Create family record
      let familyId = null;
      
      try {
        const { data: familyData, error: familyError } = await supabase.rpc("create_family", {
          family_name: `${lastName} Family`
        });
        
        if (familyError) throw familyError;
        familyId = familyData;
      } catch (error) {
        console.error("Error with RPC, falling back to direct SQL", error);
        
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
          id: authData.user?.id,
          first_name: firstName,
          last_name: lastName,
          email: email || fakeEmail,
          phone: cleanedPhone,
          address,
          emergency_contact: emergencyContact,
          emergency_phone: emergencyPhone,
          role: 'parent',
          family_id: familyId
        });
      
      if (profileError) throw profileError;
      
      // Create child records and link to parent
      for (const child of children) {
        const { data: childData, error: childError } = await supabase
          .from('children')
          .insert({
            first_name: child.firstName,
            last_name: child.lastName,
            birthdate: child.birthdate || null,
            allergies: child.allergies || null,
            special_needs: child.specialNeeds || null,
            medical_info: child.medicalInfo || null,
            family_id: familyId
          })
          .select('id')
          .single();
        
        if (childError) throw childError;
        
        // Link parent to child
        try {
          const { error: linkError } = await supabase.rpc("link_parent_child", {
            parent_id: authData.user?.id,
            child_id: childData.id
          });
          
          if (linkError) throw linkError;
        } catch (error) {
          console.error("Error with RPC, falling back to direct SQL", error);
          
          // Fallback to direct SQL insert
          const { error: linkError } = await supabase
            .from('parent_children')
            .insert({
              parent_id: authData.user?.id,
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
  
  const handleChildFormChange = (index: number, field: keyof ChildFormData, value: any) => {
    const updatedChildren = [...children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setChildren(updatedChildren);
  };
  
  // Render different steps
  const renderAccountStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Your Account</h2>
      <p className="text-gray-600">Enter your phone number and create a PIN to access the check-in system</p>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            placeholder="(555) 123-4567"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="pin">4-Digit PIN</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Create a 4-digit PIN"
            className="mt-1"
            maxLength={4}
          />
          <p className="text-xs text-gray-500 mt-1">You'll use this PIN for check-in/check-out</p>
        </div>
        
        <div>
          <Label htmlFor="confirmPin">Confirm PIN</Label>
          <Input
            id="confirmPin"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Confirm your PIN"
            className="mt-1"
            maxLength={4}
          />
        </div>
        
        <div className="flex items-start space-x-2 mt-4">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm leading-tight">
            I agree to the terms and conditions, including the privacy policy and consent for my children to participate in church activities.
          </Label>
        </div>
      </div>
    </div>
  );
  
  const renderPersonalStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Parent Information</h2>
      <p className="text-gray-600">Tell us a bit about yourself</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Your last name"
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="mt-1"
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Your address"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
          <Input
            id="emergencyContact"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Emergency contact name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="emergencyPhone">Emergency Phone (Optional)</Label>
          <Input
            id="emergencyPhone"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(formatPhoneNumber(e.target.value))}
            placeholder="Emergency contact phone"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
  
  const renderChildrenStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Child Information</h2>
      <p className="text-gray-600">Add information about your children</p>
      
      <div className="space-y-8">
        {children.map((child, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Child {index + 1}</h3>
              {children.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveChild(index)}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <ChildRegistrationForm 
              index={index}
              onChange={(field, value) => handleChildFormChange(index, field, value)}
              childData={children[index]}
            />
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={handleAddChild}
          className="w-full"
        >
          Add Another Child
        </Button>
      </div>
    </div>
  );
  
  const renderReviewStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Information</h2>
      <p className="text-gray-600">Please review your information before submitting</p>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Account Information</h3>
          <p>Phone: {phoneNumber}</p>
          <p>PIN: **** (hidden for security)</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Parent Information</h3>
          <p>Name: {firstName} {lastName}</p>
          {email && <p>Email: {email}</p>}
          {address && <p>Address: {address}</p>}
          {emergencyContact && <p>Emergency Contact: {emergencyContact} ({emergencyPhone})</p>}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium">Children</h3>
          {children.map((child, index) => (
            <div key={index} className="mt-2 border-t pt-2">
              <p>Child {index + 1}: {child.firstName} {child.lastName}</p>
              {child.birthdate && <p>Birthdate: {child.birthdate}</p>}
              {child.allergies && <p>Allergies: {child.allergies}</p>}
              {child.specialNeeds && <p>Special Needs: {child.specialNeeds}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-green-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold">Registration Complete!</h2>
      <p className="text-gray-600">
        Thank you for registering with our children's ministry check-in system.
        You can now use the check-in kiosk with your phone number and PIN.
      </p>
      
      <div className="pt-4">
        <Button 
          onClick={() => navigate("/parent-dashboard")}
          className="w-full md:w-auto"
        >
          Go to Parent Dashboard
        </Button>
      </div>
    </div>
  );
  
  // Main render method
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "account" || currentStep === "personal" || 
                  currentStep === "children" || currentStep === "review" || 
                  currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}>
                  1
                </div>
                <div className={`h-1 w-12 ${
                  currentStep === "personal" || currentStep === "children" || 
                  currentStep === "review" || currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
                }`}></div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "personal" || currentStep === "children" || 
                  currentStep === "review" || currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}>
                  2
                </div>
                <div className={`h-1 w-12 ${
                  currentStep === "children" || currentStep === "review" || 
                  currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
                }`}></div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "children" || currentStep === "review" || 
                  currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}>
                  3
                </div>
                <div className={`h-1 w-12 ${
                  currentStep === "review" || currentStep === "complete" ? "bg-blue-500" : "bg-gray-200"
                }`}></div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "review" || currentStep === "complete" ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}>
                  4
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-sm">
              <span className={currentStep === "account" ? "font-medium text-blue-600" : ""}>Account</span>
              <span className={currentStep === "personal" ? "font-medium text-blue-600" : ""}>Personal</span>
              <span className={currentStep === "children" ? "font-medium text-blue-600" : ""}>Children</span>
              <span className={currentStep === "review" || currentStep === "complete" ? "font-medium text-blue-600" : ""}>Review</span>
            </div>
          </div>
          
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {currentStep === "account" && renderAccountStep()}
              {currentStep === "personal" && renderPersonalStep()}
              {currentStep === "children" && renderChildrenStep()}
              {currentStep === "review" && renderReviewStep()}
              {currentStep === "complete" && renderCompleteStep()}
              
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
