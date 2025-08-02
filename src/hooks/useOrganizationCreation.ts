
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
      console.log("Starting organization creation process with values:", values);

      // Check if we can connect to Supabase
      const { data: healthCheck, error: healthError } = await supabase
        .from('organization_settings')
        .select('id')
        .limit(1);

      if (healthError && healthError.code !== 'PGRST116') {
        console.error("Database connection error:", healthError);
        throw new Error("Unable to connect to the database. Please check your internet connection and try again.");
      }

      console.log("Database connection verified");

      // First, sign up the admin user with organization creator flag
      console.log("Creating admin user account...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.adminEmail,
        password: values.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-dashboard`,
          data: {
            first_name: values.adminFirstName,
            last_name: values.adminLastName,
            phone: values.adminPhone || '',
            is_org_creator: true,
          }
        }
      });

      if (authError) {
        console.error("Authentication error:", authError);
        if (authError.message.includes('fetch')) {
          throw new Error("Network error during account creation. Please check your internet connection and try again.");
        }
        throw new Error(`Account creation failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account - no user data returned");
      }

      console.log("User created successfully:", authData.user.id);

      // Create organization
      console.log("Creating organization...");
      const { data: orgData, error: orgError } = await supabase.rpc('create_organization', {
        org_name: values.organizationName,
        primary_color: values.primaryColor,
        font_family: values.fontFamily,
        creator_id: authData.user.id,
      });

      if (orgError) {
        console.error("Organization creation error:", orgError);
        if (orgError.message.includes('fetch') || orgError.message.includes('network')) {
          throw new Error("Network error during organization setup. Please try again.");
        }
        throw new Error(`Organization setup failed: ${orgError.message}`);
      }

      console.log("Organization created with ID:", orgData);

      // Wait a moment to ensure user is fully created
      console.log("Waiting for user setup to complete...");
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
      console.log("Applying theme settings...");
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

      console.log("Organization setup completed successfully");
      onComplete();
      
    } catch (error: any) {
      console.error('Error creating organization:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to create organization. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString().includes('fetch')) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      } else if (error.toString().includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      toast({
        title: "Setup Failed",
        description: errorMessage,
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
