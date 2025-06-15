import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationDetailsStep } from "./OrganizationDetailsStep";
import { AdminAccountStep } from "./AdminAccountStep";
import { AppearanceStep } from "./AppearanceStep";

const organizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminPhone: z.string().optional(),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  primaryColor: z.string().default("#6366f1"),
  fontFamily: z.string().default("Inter"),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationWizardProps {
  onComplete: () => void;
}

export const OrganizationWizard = ({ onComplete }: OrganizationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPhone: "",
      adminPassword: "",
      primaryColor: "#6366f1",
      fontFamily: "Inter",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Creating organization with values:", values);

      // First, sign up the admin user using regular signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.adminEmail,
        password: values.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: values.adminFirstName,
            last_name: values.adminLastName,
            phone: values.adminPhone || '',
          }
        }
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log("User created successfully:", authData.user.id);

      // Create organization
      const { data: orgData, error: orgError } = await supabase.rpc('create_organization', {
        org_name: values.organizationName,
        primary_color: values.primaryColor,
        font_family: values.fontFamily,
        creator_id: authData.user.id,
      });

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw orgError;
      }

      console.log("Organization created:", orgData);

      // Create profile for admin user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: values.adminFirstName,
          last_name: values.adminLastName,
          phone: values.adminPhone || '',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw here, profile creation is not critical for org setup
      }

      // First, delete any auto-assigned 'parent' role (from handle_new_user trigger)
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', authData.user.id)
        .eq('role', 'parent');

      if (deleteRoleError) {
        console.error('Error deleting auto-assigned parent role:', deleteRoleError);
        // Continue anyway, as we'll insert the super_admin role
      }

      // Create super admin role (not just admin)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'super_admin',
          is_super_admin: true,
        });

      if (roleError) {
        console.error('Error creating super admin role:', roleError);
        // Don't throw here, role can be assigned later
      }

      toast({
        title: "Organization Created Successfully",
        description: "Your organization has been set up. Please check your email to confirm your account.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Organization Details",
      component: (
        <OrganizationDetailsStep
          form={form}
          logoPreview={logoPreview}
          handleLogoChange={handleLogoChange}
          onNext={() => setCurrentStep(2)}
        />
      ),
    },
    {
      title: "Admin Account",
      component: (
        <AdminAccountStep
          form={form}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      ),
    },
    {
      title: "Appearance",
      component: (
        <AppearanceStep
          form={form}
          onBack={() => setCurrentStep(2)}
          isSubmitting={isSubmitting}
        />
      ),
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {steps[currentStep - 1].component}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OrganizationWizard;
