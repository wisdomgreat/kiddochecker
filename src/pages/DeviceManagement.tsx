
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Monitor, Smartphone, Tablet, AlertCircle, CheckCircle, Trash2, Edit } from 'lucide-react';

interface DeviceProfile {
  id: string;
  device_id: string;
  name: string;
  type: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

const DeviceManagement = () => {
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    type: 'tablet',
    location: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DeviceProfile[];
    }
  });

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof newDevice) => {
      const { data, error } = await supabase.rpc('register_device', {
        p_device_id: deviceData.device_id,
        p_name: deviceData.name,
        p_type: deviceData.type,
        p_location: deviceData.location || null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsAddingDevice(false);
      setNewDevice({ device_id: '', name: '', type: 'tablet', location: '' });
      toast({
        title: "Success",
        description: "Device registered successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    }
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from('device_profiles')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast({
        title: "Success",
        description: "Device deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    }
  });

  const handleAddDevice = () => {
    if (!newDevice.device_id || !newDevice.name || !newDevice.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addDeviceMutation.mutate(newDevice);
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      deleteDeviceMutation.mutate(deviceId);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'smartphone':
        return <Smartphone className="h-4 w-4" />;
      case 'kiosk':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (device: DeviceProfile) => {
    // Simple status check - you can enhance this based on your needs
    const isRecent = new Date(device.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    return isRecent ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-600">
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const columns = [
    {
      key: 'name' as keyof DeviceProfile,
      header: 'Device Name',
      render: (value: string, item: DeviceProfile) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getDeviceIcon(item.type)}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-500">ID: {item.device_id}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'type' as keyof DeviceProfile,
      header: 'Type',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'location' as keyof DeviceProfile,
      header: 'Location',
      render: (value: string | null) => (
        <span className="text-gray-600">
          {value || 'Not specified'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'updated_at' as keyof DeviceProfile,
      header: 'Status',
      render: (value: string, item: DeviceProfile) => getStatusBadge(item),
    },
    {
      key: 'created_at' as keyof DeviceProfile,
      header: 'Registered',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (value: any, item: DeviceProfile) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Edit functionality can be added here
              toast({
                title: "Edit Device",
                description: "Edit functionality coming soon",
              });
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDeleteDevice(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-8">
          <Card className="max-w-md">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Devices</h3>
              <p className="text-sm text-gray-500 mb-4">{(error as Error).message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
            <p className="text-muted-foreground">
              Manage check-in kiosks, tablets, and other devices.
            </p>
          </div>
          <Button onClick={() => setIsAddingDevice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>

        {/* Device Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {devices.filter(d => new Date(d.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Types</CardTitle>
              <Tablet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(devices.map(d => d.type)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Device Form */}
        {isAddingDevice && (
          <Card>
            <CardHeader>
              <CardTitle>Register New Device</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Device ID</label>
                  <Input
                    placeholder="Enter unique device ID"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Device Name</label>
                  <Input
                    placeholder="Enter device name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Device Type</label>
                  <Select value={newDevice.type} onValueChange={(value) => setNewDevice(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                      <SelectItem value="kiosk">Kiosk</SelectItem>
                      <SelectItem value="computer">Computer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                  <Input
                    placeholder="Enter device location"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 mt-6">
                <Button 
                  onClick={handleAddDevice}
                  disabled={addDeviceMutation.isPending}
                >
                  {addDeviceMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingDevice(false);
                    setNewDevice({ device_id: '', name: '', type: 'tablet', location: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Devices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-12">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No Devices Registered</h3>
                <p className="text-gray-600 mb-6">Start by registering your first device for check-in operations</p>
                <Button onClick={() => setIsAddingDevice(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register First Device
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={devices}
                keyExtractor={(item) => item.id}
                searchable={true}
                loading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DeviceManagement;
