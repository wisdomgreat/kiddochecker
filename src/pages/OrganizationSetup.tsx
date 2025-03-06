
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationDetailsStep } from "@/components/organization/OrganizationDetailsStep";
import { AdminAccountStep } from "@/components/organization/AdminAccountStep";
import { AppearanceStep } from "@/components/organization/AppearanceStep";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      
      // Log the submission attempt for debugging
      console.log("Organization setup submission started", values);
      
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

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }
      
      console.log("Auth account created:", authData);
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // 2. Create organization settings using the create_organization function
      // This will avoid the ambiguous column reference issue
      const { data: orgData, error: orgError } = await supabase.rpc(
        'create_organization',
        {
          org_name: values.organizationName,
          primary_color: values.primaryColor,
          font_family: values.fontFamily,
          creator_id: authData.user.id
        }
      );
        
      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw orgError;
      }
      
      console.log("Organization created:", orgData);
      
      // 3. Set user as admin - explicitly specify all column names to avoid ambiguity
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          is_super_admin: true
        });
        
      if (roleError) {
        console.error("Role insertion error:", roleError);
        throw roleError;
      }
      
      console.log("Admin role assigned");
      
      // 4. Upload logo if provided - use fully qualified references for bucket operations
      if (logoFile && orgData) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `org-logo-${orgData}.${fileExt}`;
        
        console.log(`Uploading logo to organization_assets/${fileName}`);
        
        const { error: uploadError } = await supabase.storage
          .from('organization_assets')
          .upload(fileName, logoFile);
          
        if (uploadError) {
          console.error("Logo upload error:", uploadError);
          // Don't throw here, logo is optional
          toast({
            title: "Logo Upload Failed",
            description: "Your organization was created but we couldn't upload the logo.",
            variant: "destructive",
          });
        } else {
          console.log("Logo uploaded successfully");
          // Update organization with logo URL
          const { data: publicUrlData } = supabase.storage
            .from('organization_assets')
            .getPublicUrl(fileName);
            
          const { error: updateLogoError } = await supabase
            .from('organization_settings')
            .update({ logo_url: publicUrlData.publicUrl })
            .eq('id', orgData);
            
          if (updateLogoError) {
            console.error("Logo URL update error:", updateLogoError);
          } else {
            console.log("Logo URL updated successfully");
          }
        }
      }
      
      toast({
        title: "Organization Created",
        description: "Your organization and admin account have been set up successfully. Please sign in to continue.",
      });
      
      // Since we just created the account, we need to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.adminEmail,
        password: values.adminPassword,
      });
      
      if (signInError) {
        console.error("Sign in error:", signInError);
        // If sign in fails, redirect to login page
        navigate("/login");
      } else {
        console.log("Sign in successful, redirecting to admin dashboard");
        // Redirect to admin dashboard
        navigate("/admin-dashboard");
      }
      
    } catch (error: any) {
      console.error("Organization setup error:", error);
      setError(error.message);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization. Please try again.",
        variant: "destructive",
      });
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}
          
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="admin">Admin Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="organization">
                  <OrganizationDetailsStep 
                    form={form} 
                    logoPreview={logoPreview} 
                    handleLogoChange={handleLogoChange} 
                    onNext={() => setCurrentStep("admin")} 
                  />
                </TabsContent>
                
                <TabsContent value="admin">
                  <AdminAccountStep 
                    form={form} 
                    onBack={() => setCurrentStep("organization")} 
                    onNext={() => setCurrentStep("appearance")} 
                  />
                </TabsContent>
                
                <TabsContent value="appearance">
                  <AppearanceStep 
                    form={form} 
                    onBack={() => setCurrentStep("admin")} 
                    isSubmitting={isSubmitting} 
                  />
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
