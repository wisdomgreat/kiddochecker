
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchForm from "@/components/check-out/SearchForm";
import CheckoutTable from "@/components/check-out/CheckoutTable";
import HelpSection from "@/components/check-out/HelpSection";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import { CheckCircle, AlertTriangle, Info, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeviceRegistration } from "@/hooks/useDeviceRegistration";
import { useAttendance } from "@/hooks/useAttendance";
import { CheckoutItem } from "@/components/check-out/SearchForm";

// Create a DeviceSetup component to handle the device registration flow
const DeviceSetup = ({ 
  deviceName, 
  updateDeviceName, 
  handleRegisterDevice 
}: { 
  deviceName: string, 
  updateDeviceName: (name: string) => void, 
  handleRegisterDevice: () => void 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-semibold">Check-out Station Setup</h2>
              <p className="text-sm text-gray-500">This device needs to be registered</p>
            </div>
          </div>
          
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700">
                Station Name
              </label>
              <input
                type="text"
                id="deviceName"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Main Exit Station"
                value={deviceName}
                onChange={(e) => updateDeviceName(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Give this check-out station a descriptive name to identify it
              </p>
            </div>
            
            <Button 
              onClick={handleRegisterDevice}
              className="w-full"
            >
              Register Station
            </Button>
            
            <p className="text-center text-sm text-gray-500">
              Note: This is a one-time setup for this device
            </p>
            
            <div className="pt-2 border-t border-gray-200">
              <Link to="/login" className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800">
                <LogIn className="h-4 w-4 mr-1" />
                Staff Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Create a SetupRequired component for when organization setup is incomplete
const SetupRequired = ({ navigate }: { navigate: any }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 rounded-full p-2">
              <Info className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-semibold">Setup Required</h2>
              <p className="text-sm text-gray-500">The system has not been set up yet</p>
            </div>
          </div>
          
          <p className="mb-4 text-gray-600">
            Please complete the organization setup process before using the check-out station.
          </p>
          
          <Button 
            onClick={() => navigate('/organization-setup')}
            className="w-full"
          >
            Go to Organization Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component for the Check Out Station
const CheckOutStation = () => {
  const [results, setResults] = useState<CheckoutItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("search");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkOut } = useAttendance();

  const { 
    deviceId,
    isRegistered,
    deviceName,
    showDeviceSetup,
    isSetupComplete,
    isLoading,
    handleRegisterDevice,
    updateDeviceName
  } = useDeviceRegistration({
    deviceType: 'check_out_station',
    defaultDeviceName: "Check-out Station"
  });

  // Handle QR code scanning
  const handleScanComplete = async (qrData: string) => {
    console.log("QR Code scanned:", qrData);
    
    try {
      // Parse QR code data (format: ATTENDANCE:id|CHILD:name|CLASS:class)
      if (qrData.startsWith('ATTENDANCE:')) {
        const attendanceId = qrData.split('|')[0].replace('ATTENDANCE:', '');
        
        // Perform checkout
        await checkOut(attendanceId);
        
        toast({
          title: "Checkout Successful",
          description: "Child has been successfully checked out",
        });
      } else {
        throw new Error("Invalid QR code format");
      }
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to process QR code",
        variant: "destructive",
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-2 text-gray-600">Loading check-out station...</p>
      </div>
    );
  }

  // Organization setup required
  if (isSetupComplete === false) {
    return <SetupRequired navigate={navigate} />;
  }

  // Device setup required
  if (showDeviceSetup) {
    return (
      <DeviceSetup 
        deviceName={deviceName} 
        updateDeviceName={updateDeviceName} 
        handleRegisterDevice={() => handleRegisterDevice()}
      />
    );
  }

  // Main checkout station interface
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Child Check-out Station</h1>
          {isRegistered && deviceName && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {deviceName}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Link to="/login" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
            <LogIn className="h-4 w-4 mr-1" />
            Staff Login
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Child Check-out</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
                    <TabsTrigger value="search">Search Child</TabsTrigger>
                  </TabsList>
                  <TabsContent value="scan" className="space-y-4">
                    <QRCodeScanner onScanComplete={handleScanComplete} />
                  </TabsContent>
                  <TabsContent value="search" className="space-y-4">
                    <SearchForm 
                      onSearchResults={setResults} 
                      onReset={() => setResults([])} 
                      onResultsFound={setResults} 
                    />
                    {results.length > 0 && (
                      <CheckoutTable 
                        data={results} 
                        title="Search Results" 
                        showClearButton 
                        onClear={() => setResults([])} 
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            <HelpSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckOutStation;
