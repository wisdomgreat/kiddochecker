
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RealDevice {
  id: string;
  device_id: string;
  name: string;
  type: 'check_in_kiosk' | 'check_out_station';
  location?: string;
  created_at: string;
  updated_at: string;
  is_online: boolean;
  last_seen?: string;
}

export const useRealDevices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ["real-devices"],
    queryFn: async (): Promise<RealDevice[]> => {
      try {
        console.log("Fetching real device data from database...");
        
        const { data, error } = await supabase
          .from('device_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching devices:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("No devices registered in the system");
          return [];
        }

        // Transform data with real online status calculation
        const devicesWithStatus = data.map(device => {
          const lastSeenDate = device.updated_at ? new Date(device.updated_at) : new Date(device.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const isOnline = lastSeenDate > fiveMinutesAgo;

          return {
            id: device.id,
            device_id: device.device_id,
            name: device.name,
            type: device.type as 'check_in_kiosk' | 'check_out_station',
            location: device.location || '',
            created_at: device.created_at || new Date().toISOString(),
            updated_at: device.updated_at || new Date().toISOString(),
            is_online: isOnline,
            last_seen: device.updated_at || device.created_at
          };
        });

        console.log(`Successfully loaded ${devicesWithStatus.length} devices`);
        return devicesWithStatus;

      } catch (error: any) {
        console.error("Error in useRealDevices:", error);
        toast({
          title: "Error Loading Devices",
          description: "Failed to load device data. Please check your connection.",
          variant: "destructive",
        });
        return [];
      }
    },
    retry: 2,
    staleTime: 30000,
  });

  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceData: {
      device_id: string;
      name: string;
      type: 'check_in_kiosk' | 'check_out_station';
      location?: string;
    }) => {
      console.log("Registering new device:", deviceData);
      
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: deviceData.device_id,
        p_name: deviceData.name,
        p_type: deviceData.type,
        p_location: deviceData.location || null
      });

      if (error) {
        console.error("Device registration error:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["real-devices"] });
      toast({
        title: "Device Registered",
        description: "Device has been successfully registered and is now active.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    },
    onError: (error: any) => {
      console.error("Error registering device:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register device. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<RealDevice> 
    }) => {
      console.log("Updating device:", id, updates);
      
      const { data, error } = await supabase
        .from('device_profiles')
        .update({
          name: updates.name,
          location: updates.location,
          type: updates.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Device update error:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["real-devices"] });
      toast({
        title: "Device Updated",
        description: "Device information has been successfully updated.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    },
    onError: (error: any) => {
      console.error("Error updating device:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update device. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      console.log("Deleting device:", deviceId);
      
      const { error } = await supabase
        .from('device_profiles')
        .delete()
        .eq('id', deviceId);

      if (error) {
        console.error("Device deletion error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["real-devices"] });
      toast({
        title: "Device Removed",
        description: "Device has been successfully removed from the system.",
        className: "bg-red-50 border-red-200 text-red-800",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting device:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to remove device. Please try again.",
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
    updateDevice: updateDeviceMutation.mutate,
    isUpdating: updateDeviceMutation.isPending,
    deleteDevice: deleteDeviceMutation.mutate,
    isDeleting: deleteDeviceMutation.isPending,
  };
};

