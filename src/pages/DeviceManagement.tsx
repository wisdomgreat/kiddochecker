
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Plus, 
  Settings, 
  Wifi, 
  WifiOff,
  Battery,
  BatteryLow,
  Trash2,
  Edit,
  QrCode
} from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Device {
  id: string;
  device_id: string;
  name: string;
  type: string;
  location?: string;
  status: 'online' | 'offline' | 'maintenance';
  battery_level?: number;
  last_seen: string;
  created_at: string;
}

const DeviceManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'check_in_kiosk',
    location: '',
    device_id: ''
  });

  // Mock data for demonstration
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async (): Promise<Device[]> => {
      // Mock API call - replace with actual device management API
      return [
        {
          id: '1',
          device_id: 'KIOSK001',
          name: 'Main Entrance Kiosk',
          type: 'check_in_kiosk',
          location: 'Main Lobby',
          status: 'online',
          battery_level: 85,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          device_id: 'TABLET001',
          name: 'Teacher Tablet - Room A',
          type: 'tablet',
          location: 'Classroom A',
          status: 'online',
          battery_level: 45,
          last_seen: new Date(Date.now() - 300000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          device_id: 'KIOSK002',
          name: 'Exit Station',
          type: 'check_out_station',
          location: 'Exit Area',
          status: 'offline',
          last_seen: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date().toISOString()
        }
      ];
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof newDevice) => {
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: deviceData.device_id,
        p_name: deviceData.name,
        p_type: deviceData.type,
        p_location: deviceData.location
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast({
        title: "Success",
        description: "Device registered successfully",
      });
      setShowAddDialog(false);
      setNewDevice({ name: '', type: 'check_in_kiosk', location: '', device_id: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    },
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'check_in_kiosk':
      case 'check_out_station':
        return Monitor;
      case 'tablet':
        return Tablet;
      case 'smartphone':
        return Smartphone;
      default:
        return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAddDevice = () => {
    if (!newDevice.name || !newDevice.device_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    addDeviceMutation.mutate(newDevice);
  };

  const generateQRCode = (deviceId: string) => {
    const qrData = {
      type: 'device_setup',
      device_id: deviceId,
      timestamp: new Date().toISOString()
    };
    
    // In a real implementation, you would generate an actual QR code
    toast({
      title: "QR Code Generated",
      description: `Setup QR code generated for device ${deviceId}`,
    });
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Device Management</h1>
            <p className="text-muted-foreground">
              Manage kiosks, tablets, and other connected devices
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Device</DialogTitle>
                <DialogDescription>
                  Add a new device to your check-in system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="e.g., Main Entrance Kiosk"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="device-id">Device ID</Label>
                  <Input
                    id="device-id"
                    placeholder="e.g., KIOSK001"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select 
                    value={newDevice.type} 
                    onValueChange={(value) => setNewDevice(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                      <SelectItem value="check_out_station">Check-out Station</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="device-location">Location</Label>
                  <Input
                    id="device-location"
                    placeholder="e.g., Main Lobby"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDevice} disabled={addDeviceMutation.isPending}>
                  {addDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            return (
              <Card key={device.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DeviceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription>{device.device_id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {device.status === 'online' ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={getStatusColor(device.status)}>
                      {device.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">{device.location || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium capitalize">
                      {device.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {device.battery_level && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Battery</span>
                      <div className="flex items-center gap-1">
                        {device.battery_level > 20 ? (
                          <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
                        ) : (
                          <BatteryLow className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
                        )}
                        <span className={`text-sm font-medium ${getBatteryColor(device.battery_level)}`}>
                          {device.battery_level}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Seen</span>
                    <span className="text-sm">
                      {new Date(device.last_seen).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="mr-1 h-3 w-3" />
                      Config
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateQRCode(device.device_id)}
                    >
                      <QrCode className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Device Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Device Setup Instructions</CardTitle>
            <CardDescription>
              How to connect and configure new devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">1. Register Device</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Add Device" to register a new device with a unique ID and name.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">2. Generate QR Code</h4>
                <p className="text-sm text-muted-foreground">
                  Generate a setup QR code that contains the device configuration.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">3. Configure Device</h4>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code on the device to automatically configure it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default DeviceManagement;

