
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Device {
  id: string;
  device_id: string;
  name: string;
  type: 'check_in_kiosk' | 'check_out_station';
  location?: string;
  created_at: string;
  updated_at: string;
}

export const useDevices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async (): Promise<Device[]> => {
      try {
        const { data, error } = await supabase
          .from('device_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching devices:", error);
          return [];
        }

        // Transform the data to match our Device interface
        return (data || []).map(device => ({
          ...device,
          type: (device.type === 'check_in_kiosk' || device.type === 'check_out_station') 
            ? device.type as 'check_in_kiosk' | 'check_out_station'
            : 'check_in_kiosk' // default fallback
        }));
      } catch (error: any) {
        console.error("Error in useDevices:", error);
        return [];
      }
    },
  });

  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceData: {
      device_id: string;
      name: string;
      type: 'check_in_kiosk' | 'check_out_station';
      location?: string;
    }) => {
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: deviceData.device_id,
        p_name: deviceData.name,
        p_type: deviceData.type,
        p_location: deviceData.location || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast({
        title: "Success",
        description: "Device registered successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error registering device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    },
  });

  return {
    devices,
    isLoading,
    error,
    refetch,
    registerDevice: registerDeviceMutation.mutate,
    isRegistering: registerDeviceMutation.isPending,
  };
};

export default useDevices;

