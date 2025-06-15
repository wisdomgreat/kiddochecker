
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const createOrganization = async (values: OrganizationFormValues) => {
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
        .upsert({
          id: authData.user.id,
          first_name: values.adminFirstName,
          last_name: values.adminLastName,
          phone: values.adminPhone || '',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw here, profile creation is not critical for org setup
      }

      // Create super admin role directly - the new RLS policies should handle this correctly
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'super_admin',
          is_super_admin: true,
        });

      if (roleError) {
        console.error('Error creating super admin role:', roleError);
        toast({
          title: "Warning",
          description: "Organization created but admin role assignment failed. Please assign super admin role manually.",
          variant: "destructive",
        });
        // Don't throw here, let the organization creation succeed
      } else {
        console.log('Super admin role assigned successfully');
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

  return {
    createOrganization,
    isSubmitting,
  };
};
