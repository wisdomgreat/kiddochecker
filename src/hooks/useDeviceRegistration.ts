
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseDeviceRegistrationProps {
  deviceType: 'check_in_kiosk' | 'check_out_station';
  defaultDeviceName: string;
}

export const useDeviceRegistration = ({ deviceType, defaultDeviceName }: UseDeviceRegistrationProps) => {
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState(defaultDeviceName);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
  const { toast } = useToast();

  const generateDeviceId = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Device fingerprint', 2, 2);
    const fingerprint = canvas.toDataURL();
    
    return btoa(
      navigator.userAgent + 
      screen.width + 
      screen.height + 
      fingerprint.slice(-50)
    ).slice(0, 20);
  };

  const checkSetupComplete = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('id')
        .limit(1);

      if (error) {
        console.error("Error checking setup:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Error in checkSetupComplete:", error);
      return false;
    }
  };

  const checkDeviceRegistration = async (devId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_device_profile', {
        p_device_id: devId
      });

      if (error) {
        console.error("Error checking device registration:", error);
        setIsRegistered(false);
        setShowDeviceSetup(true);
      } else if (data && typeof data === 'object' && data !== null) {
        setIsRegistered(true);
        const deviceData = data as { name: string };
        setDeviceName(deviceData.name || defaultDeviceName);
        setShowDeviceSetup(false);
      } else {
        setIsRegistered(false);
        setShowDeviceSetup(true);
      }
    } catch (error) {
      console.error("Error checking device:", error);
      setIsRegistered(false);
      setShowDeviceSetup(true);
    }
  };

  useEffect(() => {
    const initializeDevice = async () => {
      setIsLoading(true);
      
      // Check if setup is complete
      const setupComplete = await checkSetupComplete();
      setIsSetupComplete(setupComplete);
      
      if (setupComplete) {
        // Generate device ID
        const generatedId = generateDeviceId();
        setDeviceId(generatedId);
        
        // Check device registration
        await checkDeviceRegistration(generatedId);
      }
      
      setIsLoading(false);
    };

    initializeDevice();
  }, []);

  const handleRegisterDevice = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a device name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: deviceId,
        p_name: deviceName,
        p_type: deviceType,
        p_location: 'Self-registered'
      });

      if (error) throw error;

      setIsRegistered(true);
      setShowDeviceSetup(false);
      toast({
        title: "Device Registered",
        description: `Device "${deviceName}" has been registered successfully`,
      });
    } catch (error: any) {
      console.error("Error registering device:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    }
  };

  const updateDeviceName = (name: string) => {
    setDeviceName(name);
  };

  return {
    deviceId,
    deviceName,
    isRegistered,
    isSetupComplete,
    isLoading,
    showDeviceSetup,
    handleRegisterDevice,
    updateDeviceName
  };
};

