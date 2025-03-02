
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, Lock, ArrowLeft, User2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChildRegistrationForm, { ChildFormValues } from "@/components/check-in/ChildRegistrationForm";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const parentFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  pin: z.string().min(4, { message: "PIN must be at least 4 digits" }),
  address: z.string().optional(),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
});

type ParentFormValues = z.infer<typeof parentFormSchema>;

const ParentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("parent-info");
  const [registeredChildren, setRegisteredChildren] = useState<ChildFormValues[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(parentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      pin: "",
      address: "",
      securityQuestion: "",
      securityAnswer: "",
    },
  });

  const handleAddChild = (child: ChildFormValues) => {
    setRegisteredChildren([...registeredChildren, child]);
    
    // If no family name is set yet, use the child's last name
    if (!familyName) {
      setFamilyName(`${child.lastName} Family`);
    }
    
    toast({
      title: "Child added",
      description: `${child.firstName} ${child.lastName} has been added to your registration`,
    });
  };

  const handleRemoveChild = (index: number) => {
    const updatedChildren = [...registeredChildren];
    updatedChildren.splice(index, 1);
    setRegisteredChildren(updatedChildren);
  };

  const onSubmitParentInfo = (data: ParentFormValues) => {
    // Validate and proceed to next step
    setActiveTab("children-info");
  };

  const handleCompleteRegistration = async () => {
    if (registeredChildren.length === 0) {
      toast({
        title: "No children added",
        description: "Please add at least one child to complete registration",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const formData = form.getValues();
      
      // Create fake email from phone number for auth
      const fakeEmail = `${formData.phoneNumber.replace(/\D/g, '')}@example.com`;
      
      // Sign up the parent
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: formData.pin,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phoneNumber,
          }
        }
      });

      if (authError) throw authError;
      
      if (!authData.user) throw new Error("Failed to create user account");
      
      // Update the profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          address: formData.address || null,
          security_question: formData.securityQuestion || null,
          security_answer: formData.securityAnswer || null,
        })
        .eq('id', authData.user.id);
        
      if (profileError) throw profileError;
      
      // Create family - use the raw SQL query since the table is new and TypeScript definitions aren't updated yet
      const { data: familyData, error: familyError } = await supabase
        .rpc('create_family', {
          family_name: familyName || `${formData.lastName} Family`
        });
        
      if (familyError) {
        // Fallback to direct SQL if RPC doesn't exist
        const { data, error } = await supabase
          .from('families')
          .insert({ name: familyName || `${formData.lastName} Family` })
          .select();
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Failed to create family");
        
        var familyId = data[0].id;
      } else {
        var familyId = familyData;
      }
      
      // Create children and link to parent
      for (const child of registeredChildren) {
        // Insert child
        const { data: childData, error: childError } = await supabase
          .from('children')
          .insert([
            {
              first_name: child.firstName,
              last_name: child.lastName,
              age: child.age,
              allergies: child.allergies,
              medical_info: child.medicalInfo,
              notes: child.notes,
              emergency_contact_name: child.emergencyContactName,
              emergency_contact_phone: child.emergencyContactPhone,
              parent_id: authData.user.id,
              family_id: familyId,
            }
          ])
          .select();
          
        if (childError) throw childError;
        
        if (!childData || childData.length === 0) continue;
        
        // Link child to parent in parent_children table using raw SQL since TypeScript doesn't know about the new table yet
        const { error: relationError } = await supabase.rpc('link_parent_child', {
          p_parent_id: authData.user.id,
          p_child_id: childData[0].id,
          p_relationship: 'Parent'
        });
        
        if (relationError) {
          // Fallback to direct insert if RPC doesn't exist
          const { error } = await supabase.from('parent_children').insert({
            parent_id: authData.user.id,
            child_id: childData[0].id,
            relationship: 'Parent'
          });
          
          if (error) throw error;
        }
      }
      
      setRegistrationComplete(true);
      
      toast({
        title: "Registration successful!",
        description: "Your family has been registered successfully",
      });
      
      // After a short delay, redirect to parent dashboard
      setTimeout(() => {
        navigate("/parent-dashboard");
      }, 3000);
      
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Welcome to ChurchCheck</h1>
        <p className="text-gray-600">Register your family to get started with our children's ministry</p>
      </div>
      
      {registrationComplete ? (
        <Card className="w-full max-w-2xl bg-slate-50/90 border-0 shadow-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="bg-green-100 rounded-full p-4 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Registration Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your family has been registered successfully. You'll be redirected to your dashboard in a moment.
              </p>
              <Button
                onClick={() => navigate("/parent-dashboard")}
                className="w-full sm:w-auto"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl bg-slate-50/90 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/check-in-kiosk")}
                className="rounded-full h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-left">
                <h2 className="text-xl font-semibold">Parent Registration</h2>
                <p className="text-sm text-gray-500">Complete your family profile</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="parent-info">Parent Info</TabsTrigger>
                <TabsTrigger value="children-info">Children</TabsTrigger>
              </TabsList>
              
              <TabsContent value="parent-info">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitParentInfo)} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="First name" 
                                  {...field} 
                                  className="pl-10"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <User2 className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Last name" 
                                  {...field} 
                                  className="pl-10"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <User2 className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="(555) 123-4567" 
                                {...field} 
                                value={formatPhoneNumber(field.value)}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value);
                                  field.onChange(formatted);
                                }}
                                className="pl-10"
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            We'll use this number for check-in and important notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="password" 
                                placeholder="Enter 4-digit PIN" 
                                {...field}
                                maxLength={4}
                                onChange={(e) => {
                                  // Only allow numeric input
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 4) {
                                    field.onChange(value);
                                  }
                                }}
                                className="pl-10"
                              />
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Create a 4-digit PIN for check-in and security
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your address" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="securityQuestion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Question (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Security question for account recovery" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("securityQuestion") && (
                      <FormField
                        control={form.control}
                        name="securityAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Answer</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Answer to your security question" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <Button type="submit" className="w-full">
                      Continue to Add Children
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="children-info">
                <div className="space-y-6 mt-4">
                  <ChildRegistrationForm 
                    onAddChild={handleAddChild}
                    registeredChildren={registeredChildren}
                    onRemoveChild={handleRemoveChild}
                    familyName={familyName}
                    onFamilyNameChange={setFamilyName}
                  />
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("parent-info")}
                    >
                      Back to Parent Info
                    </Button>
                    <Button 
                      onClick={handleCompleteRegistration}
                      disabled={loading || registeredChildren.length === 0}
                    >
                      {loading ? "Processing..." : "Complete Registration"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParentRegistration;
