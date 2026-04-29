
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrganizationStatus {
  isComplete: boolean;
  hasSettings: boolean;
  hasAdminUser: boolean;
  hasClasses: boolean;
  setupPercentage: number;
  missingSteps: string[];
}

export const useOrganizationSetup = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkSetupStatus = useQuery({
    queryKey: ["organization-setup-status"],
    queryFn: async (): Promise<OrganizationStatus> => {
      try {
        // Check organization settings
        const { data: settings, error: settingsError } = await supabase
          .from('organization_settings')
          .select('*')
          .limit(1);

        if (settingsError) throw settingsError;

        // Check for admin users
        const { data: adminUsers, error: adminError } = await supabase
          .from('user_roles')
          .select('*')
          .in('role', ['admin', 'super_admin'])
          .limit(1);

        if (adminError) throw adminError;

        // Check for classes
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .limit(1);

        if (classesError) throw classesError;

        const hasSettings = settings && settings.length > 0;
        const hasAdminUser = adminUsers && adminUsers.length > 0;
        const hasClasses = classes && classes.length > 0;

        const completedSteps = [hasSettings, hasAdminUser, hasClasses].filter(Boolean).length;
        const totalSteps = 3;
        const setupPercentage = Math.round((completedSteps / totalSteps) * 100);

        const missingSteps = [];
        if (!hasSettings) missingSteps.push("Organization settings");
        if (!hasAdminUser) missingSteps.push("Admin user account");
        if (!hasClasses) missingSteps.push("Class setup");

        const isComplete = hasSettings && hasAdminUser && hasClasses;

        return {
          isComplete,
          hasSettings,
          hasAdminUser,
          hasClasses,
          setupPercentage,
          missingSteps,
        };
      } catch (error) {
        console.error("Error checking setup status:", error);
        return {
          isComplete: false,
          hasSettings: false,
          hasAdminUser: false,
          hasClasses: false,
          setupPercentage: 0,
          missingSteps: ["Unable to verify setup status"],
        };
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const completeSetupStep = useMutation({
    mutationFn: async (stepData: any) => {
      // This would handle completing individual setup steps
      // Implementation depends on the specific step being completed
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-setup-status"] });
      toast({
        title: "Setup step completed",
        description: "Organization setup has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup step failed",
        description: error.message || "Failed to complete setup step",
        variant: "destructive",
      });
    },
  });

  return {
    setupStatus: checkSetupStatus.data,
    isCheckingSetup: checkSetupStatus.isLoading,
    refreshSetupStatus: checkSetupStatus.refetch,
    completeSetupStep: completeSetupStep.mutate,
    isCompletingStep: completeSetupStep.isPending,
  };
};

