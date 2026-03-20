
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OrganizationSettings {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  font_family: string;
  kiosk_id?: string;
  require_checkout_signature?: boolean;
  google_maps_api_key?: string;
  show_center_finder?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["organization-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as OrganizationSettings;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<OrganizationSettings>) => {
      const { data, error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', settingsQuery.data?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};
