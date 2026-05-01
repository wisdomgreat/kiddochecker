
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

const DeviceEnrollment = () => {
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [location, setLocation] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const { toast } = useToast();

  // Generate a unique device ID
  const generateDeviceId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `device_${timestamp}_${random}`;
  };

  const handleEnrollDevice = async () => {
    if (!deviceName || !deviceType) {
      toast({
        title: "Missing Information",
        description: "Please fill in device name and type",
        variant: "destructive",
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const newDeviceId = generateDeviceId();
      
      const { data, error } = await supabase
        .from('device_profiles')
        .insert({
          device_id: newDeviceId,
          name: deviceName,
          type: deviceType,
          location: location || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDeviceId(newDeviceId);
      setEnrollmentSuccess(true);
      
      toast({
        title: "Device Enrolled Successfully!",
        description: `${deviceName} has been registered as a ${deviceType}`,
      });

      // Reset form
      setDeviceName('');
      setDeviceType('');
      setLocation('');
      
    } catch (error: any) {
      console.error('Device enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll device",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const resetEnrollment = () => {
    setEnrollmentSuccess(false);
    setDeviceId('');
  };

  if (enrollmentSuccess) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Device Enrolled Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Device Information:</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Device ID:</strong> {deviceId}</div>
                <div><strong>Name:</strong> {deviceName}</div>
                <div><strong>Type:</strong> {deviceType}</div>
                {location && <div><strong>Location:</strong> {location}</div>}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This device is now registered in the system</li>
                <li>• Staff can use this device for check-in/check-out operations</li>
                <li>• The device will appear in the admin dashboard</li>
                <li>• You can configure additional settings in Device Management</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={resetEnrollment} variant="outline" className="flex-1">
                Enroll Another Device
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin/devices'} 
                className="flex-1"
              >
                Manage Devices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Device Enrollment</h1>
        <p className="text-muted-foreground">
          Register a new device for check-in/check-out operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name *</Label>
            <Input
              id="deviceName"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., Front Desk Kiosk, iPad Station 1"
              disabled={isEnrolling}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceType">Device Type *</Label>
            <Select value={deviceType} onValueChange={setDeviceType} disabled={isEnrolling}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                <SelectItem value="check_out_station">Check-out Station</SelectItem>
                <SelectItem value="mobile_tablet">Mobile Tablet</SelectItem>
                <SelectItem value="staff_terminal">Staff Terminal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Entrance, Children's Wing"
              disabled={isEnrolling}
            />
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Important Notes:</h4>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  <li>• Make sure this device has internet connectivity</li>
                  <li>• The device will be assigned a unique ID automatically</li>
                  <li>• Only authorized staff should have access to enrolled devices</li>
                  <li>• Device settings can be modified later in the admin panel</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleEnrollDevice}
            disabled={isEnrolling || !deviceName || !deviceType}
            className="w-full h-12 text-lg"
          >
            {isEnrolling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enrolling Device...
              </>
            ) : (
              <>
                <Monitor className="h-5 w-5 mr-2" />
                Enroll Device
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Device Type Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Device Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Monitor className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold">Check-in Kiosk</h4>
                <p className="text-sm text-muted-foreground">
                  Fixed station for parents to check in their children
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Monitor className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold">Check-out Station</h4>
                <p className="text-sm text-muted-foreground">
                  Dedicated terminal for child pickup and checkout
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-semibold">Mobile Tablet</h4>
                <p className="text-sm text-muted-foreground">
                  Portable device for staff to use anywhere
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Monitor className="h-6 w-6 text-orange-600 mt-1" />
              <div>
                <h4 className="font-semibold">Staff Terminal</h4>
                <p className="text-sm text-muted-foreground">
                  Computer workstation for staff operations
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceEnrollment;

