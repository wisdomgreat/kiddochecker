
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/check-in/LoginForm";
import RegistrationPrompt from "@/components/check-in/RegistrationPrompt";
import { useNavigate, Link } from "react-router-dom";
import { Info, Users, ArrowRight, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeviceRegistration } from "@/hooks/useDeviceRegistration";

const CheckInKiosk = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
    deviceType: 'check_in_kiosk',
    defaultDeviceName: "Check-in Kiosk"
  });

  const handleRegister = () => {
    navigate("/parent-registration");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="ml-2 text-gray-600">Loading kiosk...</p>
      </div>
    );
  }

  if (isSetupComplete === false) {
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
              Please complete the organization setup process before using the check-in kiosk.
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
  }

  if (showDeviceSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-2">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold">Kiosk Setup</h2>
                <p className="text-sm text-gray-500">This device needs to be registered</p>
              </div>
            </div>
            
            <div className="space-y-4 mt-4">
              <div>
                <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700">
                  Kiosk Name
                </label>
                <input
                  type="text"
                  id="deviceName"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Main Entrance Kiosk"
                  value={deviceName}
                  onChange={(e) => updateDeviceName(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Give this check-in kiosk a descriptive name to identify it
                </p>
              </div>
              
              <Button 
                onClick={() => handleRegisterDevice()}
                className="w-full"
              >
                Register Kiosk
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
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Parent Check-in Kiosk</h1>
          {isRegistered && deviceName && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
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

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          {/* Left column - Login form */}
          <div className="space-y-6">
            {showRegistration ? (
              <RegistrationPrompt onSignUp={handleRegister} />
            ) : (
              <LoginForm 
                onSignUp={() => setShowRegistration(true)} 
              />
            )}
          </div>

          {/* Right column - Information */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Welcome to Child Check-in
                </h2>
                <p className="text-gray-600 mb-4">
                  Please sign in with your phone number and PIN to check in your children. 
                  If this is your first time, you'll need to register first.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="ml-2 text-sm text-gray-600">
                      Quick and secure check-in for your children
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="ml-2 text-sm text-gray-600">
                      Printable name tags with secure pick-up codes
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="ml-2 text-sm text-gray-600">
                      Easy class selection for age-appropriate rooms
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleRegister}
                  >
                    New Parent? Register Here
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckInKiosk;
