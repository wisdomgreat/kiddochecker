
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getDeviceProfile, registerDevice, isSetupCompleted } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

export interface DeviceRegistrationState {
  deviceId: string;
  isRegistered: boolean;
  deviceName: string;
  showDeviceSetup: boolean;
  isSetupComplete: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export interface DeviceRegistrationProps {
  deviceType: 'check_in_kiosk' | 'check_out_station';
  defaultDeviceName?: string;
}

export function useDeviceRegistration({ 
  deviceType, 
  defaultDeviceName 
}: DeviceRegistrationProps) {
  const [state, setState] = useState<DeviceRegistrationState>({
    deviceId: "",
    isRegistered: false,
    deviceName: defaultDeviceName || "",
    showDeviceSetup: false,
    isSetupComplete: null,
    isLoading: true,
    error: null
  });
  const { toast } = useToast();

  useEffect(() => {
    const initializeDevice = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Check if organization setup is completed
        const setupComplete = await isSetupCompleted();
        
        if (!setupComplete) {
          setState(prev => ({ 
            ...prev, 
            isSetupComplete: false,
            isLoading: false 
          }));
          return;
        }

        // Get or create device ID from local storage
        let storedDeviceId = localStorage.getItem('device_id');
        if (!storedDeviceId) {
          storedDeviceId = uuidv4();
          localStorage.setItem('device_id', storedDeviceId);
        }
        
        // Check if device is registered
        const deviceProfile = await getDeviceProfile(storedDeviceId);
        
        if (deviceProfile) {
          // Fix: Check if deviceProfile is an object and properly access its properties
          const deviceName = 
            typeof deviceProfile === 'object' && deviceProfile !== null 
              ? (deviceProfile as any).name || defaultDeviceName || (deviceType === 'check_in_kiosk' ? "Check-in Kiosk" : "Check-out Station") 
              : defaultDeviceName || (deviceType === 'check_in_kiosk' ? "Check-in Kiosk" : "Check-out Station");
              
          setState(prev => ({
            ...prev,
            deviceId: storedDeviceId,
            isRegistered: true,
            deviceName,
            isSetupComplete: setupComplete,
          }));
        } else {
          setState(prev => ({
            ...prev,
            deviceId: storedDeviceId,
            isRegistered: false,
            showDeviceSetup: true,
            isSetupComplete: setupComplete,
          }));
        }
      } catch (error) {
        console.error(`Error initializing ${deviceType}:`, error);
        setState(prev => ({ 
          ...prev, 
          error: `Failed to initialize ${deviceType}` 
        }));
        
        toast({
          title: "Error",
          description: `Failed to initialize ${deviceType}`,
          variant: "destructive",
        });
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeDevice();
  }, [deviceType, defaultDeviceName, toast]);

  const handleRegisterDevice = async (customName?: string) => {
    const deviceName = customName || state.deviceName;
    
    if (!deviceName.trim()) {
      toast({
        title: "Error",
        description: `Please provide a name for this ${deviceType}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await registerDevice({
        device_id: state.deviceId,
        name: deviceName,
        type: deviceType,
      });

      if (result) {
        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          showDeviceSetup: false,
          deviceName 
        }));
        
        toast({
          title: "Success",
          description: `${deviceType === 'check_in_kiosk' ? 'Kiosk' : 'Station'} registered successfully`,
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error registering ${deviceType}:`, error);
      toast({
        title: "Error",
        description: `Failed to register ${deviceType}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateDeviceName = (name: string) => {
    setState(prev => ({ ...prev, deviceName: name }));
  };

  return {
    ...state,
    handleRegisterDevice,
    updateDeviceName
  };
}
