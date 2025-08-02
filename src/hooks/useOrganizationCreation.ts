
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/providers/ThemeProvider";

interface OrganizationFormValues {
  organizationName: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
  primaryColor: string;
  fontFamily: string;
}

export const useOrganizationCreation = (onComplete: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { updateTheme } = useTheme();

  const createOrganization = async (values: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("Creating organization with values:", values);

      // First, sign up the admin user with organization creator flag
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.adminEmail,
        password: values.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-dashboard`,
          data: {
            first_name: values.adminFirstName,
            last_name: values.adminLastName,
            phone: values.adminPhone || '',
            is_org_creator: true, // This prevents auto-assignment of parent role
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

      // Wait a moment to ensure user is fully created
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now assign super admin role using the new database function
      console.log("Assigning super_admin role to organization creator:", authData.user.id);
      const { data: roleResult, error: roleError } = await supabase.rpc('assign_organization_creator_role', {
        p_user_id: authData.user.id,
        p_org_id: orgData,
      });

      if (roleError) {
        console.error('Failed to assign organization creator role:', roleError);
        toast({
          title: "Warning",
          description: "Organization created but admin role assignment failed. Please contact support.",
          variant: "destructive",
        });
      } else {
        console.log('Organization creator role assigned successfully');
      }

      // Apply the selected theme immediately
      const colorScheme = values.primaryColor === '#6366f1' ? 'purple' : 
                          values.primaryColor === '#3b82f6' ? 'blue' :
                          values.primaryColor === '#22c55e' ? 'green' : 'purple';

      updateTheme({
        theme: "light",
        colorScheme,
        highContrast: false,
        largeText: false,
        animations: true,
      });

      toast({
        title: "Organization Created Successfully!",
        description: "Your organization has been set up. You can now sign in to access the admin dashboard.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createOrganization,
    isSubmitting,
  };
};
