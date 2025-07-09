
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Monitor, Plus, Trash2, Settings, Wifi, WifiOff } from 'lucide-react';
import { useDevices } from '@/hooks/useDevices';
import { useToast } from '@/hooks/use-toast';

const DeviceManagement = () => {
  const { devices, registerDevice, isRegistering, isLoading } = useDevices();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'check_in_kiosk' as 'check_in_kiosk' | 'check_out_station',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Device name is required",
        variant: "destructive",
      });
      return;
    }

    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await registerDevice({
        device_id: deviceId,
        name: formData.name,
        type: formData.type,
        location: formData.location || undefined
      });
      
      setFormData({ name: '', type: 'check_in_kiosk', location: '' });
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Device registered successfully",
      });
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  const openKioskMode = (deviceType: string) => {
    const url = deviceType === 'check_in_kiosk' ? '/check-in-kiosk' : '/check-out-station';
    window.open(url, '_blank', 'fullscreen=yes,toolbar=no,location=no,status=no,menubar=no');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
            <p className="text-muted-foreground">
              Manage check-in kiosks and other devices for your organization.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>

        {/* Add Device Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Register New Device</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Device Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Front Desk Kiosk"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Device Type</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'check_in_kiosk' | 'check_out_station') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                      <SelectItem value="check_out_station">Check-out Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Entrance"
                  />
                </div>
                
                <div className="md:col-span-3 flex gap-2">
                  <Button type="submit" disabled={isRegistering}>
                    {isRegistering ? 'Registering...' : 'Register Device'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No devices registered</h3>
                <p className="text-muted-foreground mb-4">Register your first device to get started</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      {device.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Online
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <Badge variant="secondary">
                        {device.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    
                    {device.location && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Location:</span>
                        <span className="text-sm">{device.location}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created:</span>
                      <span className="text-sm">{new Date(device.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => openKioskMode(device.type)}
                      className="flex-1"
                      size="sm"
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      Open Kiosk
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => openKioskMode('check_in_kiosk')}
                className="flex items-center justify-center p-6 h-auto"
              >
                <div className="text-center">
                  <Monitor className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Open Check-in Kiosk</div>
                  <div className="text-sm opacity-90">Launch full-screen kiosk mode</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => openKioskMode('check_out_station')}
                variant="outline"
                className="flex items-center justify-center p-6 h-auto"
              >
                <div className="text-center">
                  <Monitor className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">Open Check-out Station</div>
                  <div className="text-sm opacity-90">Launch check-out interface</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeviceManagement;
