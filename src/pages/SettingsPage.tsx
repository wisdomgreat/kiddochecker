
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Building, Palette, Bell, Shield, Printer } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    organizationName: 'KiddoChecker',
    primaryColor: '#6366f1',
    fontFamily: 'Inter',
    notifications: true,
    autoCheckout: false,
    printNameTags: true,
    printerName: '',
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, primaryColor: color }));
    // Apply theme color immediately
    document.documentElement.style.setProperty('--primary', color);
  };

  const handlePrintTest = () => {
    // Mock print test
    toast({
      title: "Print Test",
      description: "Test name tag sent to printer.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your organization settings and preferences.
            </p>
          </div>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="organization" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organization">
              <Building className="h-4 w-4 mr-2" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="printing">
              <Printer className="h-4 w-4 mr-2" />
              Printing
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={settings.organizationName}
                    onChange={(e) => setSettings(prev => ({ ...prev, organizationName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Enter organization address" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="Enter phone number" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex space-x-2 mt-2">
                    {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          settings.primaryColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select value={settings.fontFamily} onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Check-out</Label>
                    <p className="text-sm text-muted-foreground">Automatically check out children at closing time</p>
                  </div>
                  <Switch
                    checked={settings.autoCheckout}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoCheckout: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Printing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-print Name Tags</Label>
                    <p className="text-sm text-muted-foreground">Automatically print name tags during check-in</p>
                  </div>
                  <Switch
                    checked={settings.printNameTags}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printNameTags: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="printer">Default Printer</Label>
                  <Select value={settings.printerName} onValueChange={(value) => setSettings(prev => ({ ...prev, printerName: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select printer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brother-ql">Brother QL-800</SelectItem>
                      <SelectItem value="zebra-zp">Zebra ZP 450</SelectItem>
                      <SelectItem value="dymo-450">Dymo LabelWriter 450</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handlePrintTest} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Test Print
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <Label>Require PIN for check-out</Label>
                  <Switch defaultChecked />
                </div>
                <div>
                  <Label>Enable audit logs</Label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
