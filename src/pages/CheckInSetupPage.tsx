
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Monitor, Printer, Wifi } from 'lucide-react';

const CheckInSetupPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    deviceName: 'Check-in Kiosk',
    enablePrinting: true,
    enableQRScanning: true,
    autoCheckIn: false,
    securityMode: true,
    printerName: 'Default Printer',
    kioskMode: false,
  });

  const handleSave = () => {
    // Save settings logic would go here
    toast({
      title: "Settings Saved",
      description: "Check-in setup has been updated successfully",
    });
  };

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Check-In Setup</h1>
            <p className="text-muted-foreground">
              Configure your check-in kiosk and devices
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Device Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={settings.deviceName}
                  onChange={(e) => handleSettingChange('deviceName', e.target.value)}
                  placeholder="Enter device name"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="kioskMode">Kiosk Mode</Label>
                  <p className="text-sm text-gray-500">Full screen kiosk interface</p>
                </div>
                <Switch
                  id="kioskMode"
                  checked={settings.kioskMode}
                  onCheckedChange={(checked) => handleSettingChange('kioskMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="securityMode">Security Mode</Label>
                  <p className="text-sm text-gray-500">Enhanced security features</p>
                </div>
                <Switch
                  id="securityMode"
                  checked={settings.securityMode}
                  onCheckedChange={(checked) => handleSettingChange('securityMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Printing Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="h-5 w-5 mr-2" />
                Printing Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enablePrinting">Enable Printing</Label>
                  <p className="text-sm text-gray-500">Print name tags for children</p>
                </div>
                <Switch
                  id="enablePrinting"
                  checked={settings.enablePrinting}
                  onCheckedChange={(checked) => handleSettingChange('enablePrinting', checked)}
                />
              </div>

              {settings.enablePrinting && (
                <div>
                  <Label htmlFor="printerName">Printer Name</Label>
                  <Input
                    id="printerName"
                    value={settings.printerName}
                    onChange={(e) => handleSettingChange('printerName', e.target.value)}
                    placeholder="Enter printer name"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-In Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-5 w-5 mr-2" />
                Check-In Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableQRScanning">QR Code Scanning</Label>
                  <p className="text-sm text-gray-500">Enable QR code checkout</p>
                </div>
                <Switch
                  id="enableQRScanning"
                  checked={settings.enableQRScanning}
                  onCheckedChange={(checked) => handleSettingChange('enableQRScanning', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoCheckIn">Auto Check-In</Label>
                  <p className="text-sm text-gray-500">Automatically check in when selected</p>
                </div>
                <Switch
                  id="autoCheckIn"
                  checked={settings.autoCheckIn}
                  onCheckedChange={(checked) => handleSettingChange('autoCheckIn', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database Connection</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Printer Status</span>
                <span className="text-green-600 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Network Status</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CheckInSetupPage;
