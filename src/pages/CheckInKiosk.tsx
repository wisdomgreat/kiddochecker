
import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, User, Clock, Settings, Wifi } from "lucide-react";
import LoginForm from "@/components/check-in/LoginForm";
import { CheckoutTable } from "@/components/check-out/CheckoutTable";
import { SearchForm } from "@/components/check-out/SearchForm";

const CheckInKiosk = () => {
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const location = useLocation();

  // Check if device ID is provided in URL
  useEffect(() => {
    const urlDeviceId = searchParams.get('device_id');
    if (urlDeviceId) {
      setDeviceId(urlDeviceId);
      checkDeviceRegistration(urlDeviceId);
    } else {
      // Generate a device ID based on browser fingerprint
      const browserFingerprint = generateDeviceId();
      setDeviceId(browserFingerprint);
      checkDeviceRegistration(browserFingerprint);
    }
  }, [searchParams]);

  const generateDeviceId = () => {
    // Simple device fingerprinting
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

  const checkDeviceRegistration = async (devId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_device_profile', {
        p_device_id: devId
      });

      if (error) {
        console.error("Error checking device registration:", error);
        setIsRegistered(false);
      } else if (data) {
        setIsRegistered(true);
        setDeviceName(data.name);
        setIsConnected(true);
        toast({
          title: "Device Connected",
          description: `Connected as ${data.name}`,
        });
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error("Error checking device:", error);
      setIsRegistered(false);
    }
  };

  const registerDevice = async () => {
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
        p_type: 'check_in_kiosk',
        p_location: 'Self-registered'
      });

      if (error) throw error;

      setIsRegistered(true);
      setIsConnected(true);
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

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Device Setup</CardTitle>
            <p className="text-gray-600">Register this device as a check-in/check-out kiosk</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Device ID</label>
              <Input 
                value={deviceId} 
                readOnly 
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                This ID is automatically generated for this device
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Device Name</label>
              <Input 
                placeholder="e.g., Front Desk Kiosk"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={registerDevice}
              className="w-full"
              disabled={!deviceName.trim()}
            >
              Register Device
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Check-In/Out Kiosk</h1>
              <p className="text-sm text-gray-500">{deviceName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
              <Wifi className="h-3 w-3" />
              <span>{isConnected ? "Connected" : "Offline"}</span>
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checkin" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Check In</span>
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Check Out</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Welcome! Please Sign In</h2>
              <p className="text-gray-600">Parents can check in their children here</p>
            </div>
            
            <div className="flex justify-center">
              <LoginForm onSignUp={() => {}} />
            </div>
          </TabsContent>

          <TabsContent value="checkout" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Check Out Children</h2>
              <p className="text-gray-600">Search for children to check them out</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SearchForm />
              </div>
              <div className="lg:col-span-2">
                <CheckoutTable />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CheckInKiosk;
