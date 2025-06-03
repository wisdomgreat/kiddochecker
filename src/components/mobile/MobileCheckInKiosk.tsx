
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/check-in/LoginForm";
import { useNavigate, Link } from "react-router-dom";
import { Info, Users, LogIn, Phone, Shield } from "lucide-react";
import { useDeviceRegistration } from "@/hooks/useDeviceRegistration";

const MobileCheckInKiosk = () => {
  const navigate = useNavigate();
  
  const { 
    isRegistered,
    deviceName,
    showDeviceSetup,
    isSetupComplete,
    isLoading,
    handleRegisterDevice,
    updateDeviceName
  } = useDeviceRegistration({
    deviceType: 'check_in_kiosk',
    defaultDeviceName: "Mobile Check-in"
  });

  const handleRegister = () => {
    navigate("/parent-registration");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mobile kiosk...</p>
        </div>
      </div>
    );
  }

  if (isSetupComplete === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <div className="bg-amber-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Info className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Setup Required</h2>
            <p className="text-sm text-gray-500 mb-4">
              System setup needed before using check-in
            </p>
            <Button 
              onClick={() => navigate('/organization-setup')}
              className="w-full"
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showDeviceSetup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Mobile Setup</h2>
              <p className="text-sm text-gray-500">Register this mobile device</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Mobile Check-in"
                  value={deviceName}
                  onChange={(e) => updateDeviceName(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={() => handleRegisterDevice()}
                className="w-full"
              >
                Register Device
              </Button>
              
              <div className="pt-4 border-t border-gray-200 text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Check-in</h1>
            {isRegistered && deviceName && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {deviceName}
              </span>
            )}
          </div>
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <LogIn className="h-4 w-4 mr-1" />
            Staff
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Login Form - Mobile Optimized */}
          <LoginForm onSignUp={handleRegister} />

          {/* Information Card */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Quick & Secure</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                      Fast child check-in
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                      Secure pickup codes
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                      Printable name tags
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">Secure System</h4>
                  <p className="text-sm text-green-700">Your children's safety is our priority</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation/Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={handleRegister}
            variant="outline"
            className="w-full"
          >
            New Parent? Register Here
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileCheckInKiosk;
