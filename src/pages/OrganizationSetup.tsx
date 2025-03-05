import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Upload } from "lucide-react";

// Form schema for organization setup
const organizationSchema = z.object({
  organizationName: z.string().min(2, {
    message: "Organization name must be at least 2 characters."
  }),
  adminEmail: z.string().email({
    message: "Please enter a valid email address."
  }),
  adminPassword: z.string().min(8, {
    message: "Password must be at least 8 characters."
  }),
  adminFirstName: z.string().min(1, {
    message: "First name is required."
  }),
  adminLastName: z.string().min(1, {
    message: "Last name is required."
  }),
  adminPhone: z.string().optional(),
  primaryColor: z.string().default("#6366f1"),
  fontFamily: z.string().default("Inter"),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const OrganizationSetup = () => {
  const [currentStep, setCurrentStep] = useState("organization");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: "",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
      adminPhone: "",
      primaryColor: "#6366f1",
      fontFamily: "Inter",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: OrganizationFormValues) => {
    try {
      setIsSubmitting(true);
      
      // 1. Create user account for admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.adminEmail,
        password: values.adminPassword,
        options: {
          data: {
            first_name: values.adminFirstName,
            last_name: values.adminLastName,
            phone: values.adminPhone,
          }
        }
      });

      if (authError) throw authError;
      
      // 2. Create organization settings using raw query
      const { data: orgData, error: orgError } = await supabase
        .rpc('create_organization', {
          org_name: values.organizationName,
          primary_color: values.primaryColor,
          font_family: values.fontFamily,
          creator_id: authData.user?.id
        });
        
      if (orgError) throw orgError;
      
      // 3. Set user as super admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({
          role: 'admin',
          is_super_admin: true
        })
        .eq('user_id', authData.user?.id);
        
      if (roleError) throw roleError;
      
      // 4. Upload logo if provided
      if (logoFile && orgData?.id) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `org-logo-${orgData.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('organization_assets')
          .upload(fileName, logoFile);
          
        if (uploadError) throw uploadError;
        
        // Update organization with logo URL
        const { data: publicUrlData } = supabase.storage
          .from('organization_assets')
          .getPublicUrl(fileName);
          
        await supabase
          .rpc('update_organization_logo', { 
            org_id: orgData.id, 
            logo_url: publicUrlData.publicUrl 
          });
      }
      
      toast({
        title: "Organization Created",
        description: "Your organization and admin account have been set up successfully.",
      });
      
      // Redirect to admin dashboard
      navigate("/admin-dashboard");
      
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization. Please try again.",
        variant: "destructive",
      });
      console.error("Organization setup error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600">ChurchCheck Setup</CardTitle>
          <CardDescription>
            Set up your organization and create your administrator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="admin">Admin Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="organization">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your church or organization name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Organization Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        {logoPreview && (
                          <div className="w-24 h-24 border rounded-md overflow-hidden">
                            <img 
                              src={logoPreview} 
                              alt="Logo preview" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <label 
                            htmlFor="logo-upload" 
                            className="flex items-center justify-center gap-2 w-full h-12 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Upload size={18} />
                            <span>Upload Logo</span>
                          </label>
                          <input 
                            id="logo-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleLogoChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <Button type="button" onClick={() => setCurrentStep("admin")}>
                        Next: Admin Account
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="admin">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="adminFirstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="adminLastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="adminPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="adminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Create a secure password" 
                                {...field} 
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep("organization")}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setCurrentStep("appearance")}>
                        Next: Appearance
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="appearance">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-3">
                            <Input type="color" {...field} className="w-14 h-14 p-1 cursor-pointer" />
                            <Input value={field.value} onChange={field.onChange} className="flex-1" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Montserrat">Montserrat</SelectItem>
                              <SelectItem value="Lato">Lato</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-6 flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep("admin")}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Setting up..." : "Complete Setup"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          ChurchCheck &copy; {new Date().getFullYear()} | Secure Check-in for your ministry
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrganizationSetup;
