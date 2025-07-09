
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Monitor, Plus, Settings, Wifi, ExternalLink, MapPin } from 'lucide-react';
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
      toast({
        title: "Error",
        description: "Failed to register device",
        variant: "destructive",
      });
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading devices...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-1">
              Manage check-in kiosks and other devices for your organization.
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>

        {/* Add Device Form */}
        {showAddForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Register New Device</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Device Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Front Desk Kiosk"
                    required
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Device Type</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'check_in_kiosk' | 'check_out_station') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                      <SelectItem value="check_out_station">Check-out Station</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Entrance"
                    className="bg-white"
                  />
                </div>
                
                <div className="md:col-span-3 flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isRegistering}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      'Register Device'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-200 hover:border-green-300 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Check-in Kiosk</h3>
                <p className="text-gray-600 mb-4">Launch full-screen kiosk mode for check-ins</p>
                <Button 
                  onClick={() => openKioskMode('check_in_kiosk')}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Kiosk Mode
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 hover:border-orange-300 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Check-out Station</h3>
                <p className="text-gray-600 mb-4">Launch check-out interface</p>
                <Button 
                  onClick={() => openKioskMode('check_out_station')}
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Station
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Registered Devices</h2>
          
          {devices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No devices registered</h3>
                <p className="text-gray-600 mb-6">Register your first device to get started</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Monitor className="h-5 w-5" />
                        {device.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Wifi className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Online
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type:</span>
                        <Badge variant="secondary" className="text-xs">
                          {device.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      
                      {device.location && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Location:</span>
                          <span className="text-sm flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {device.location}
                          </span>
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
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeviceManagement;
