
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRealDevices, RealDevice } from "@/hooks/useRealDevices";
import { Monitor, Smartphone, MapPin, Calendar, Edit2, Trash2, Plus, Wifi, WifiOff } from "lucide-react";
import ModernLayout from "@/components/layout/ModernLayout";
import RoleGuard from "@/components/security/RoleGuard";
import { useToast } from "@/hooks/use-toast";

const DeviceManagementPage = () => {
  const { devices, isLoading, registerDevice, isRegistering, updateDevice, deleteDevice } = useRealDevices();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<RealDevice | null>(null);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    type: 'check_in_kiosk' as 'check_in_kiosk' | 'check_out_station',
    location: ''
  });

  const handleAddDevice = async () => {
    if (!newDevice.device_id || !newDevice.name) {
      toast({
        title: "Validation Error",
        description: "Device ID and name are required fields.",
        variant: "destructive",
      });
      return;
    }

    registerDevice(newDevice);
    setNewDevice({ device_id: '', name: '', type: 'check_in_kiosk', location: '' });
    setShowAddModal(false);
  };

  const handleEditDevice = (device: RealDevice) => {
    setSelectedDevice(device);
    setShowEditModal(true);
  };

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return;

    updateDevice({
      id: selectedDevice.id,
      updates: selectedDevice
    });
    setShowEditModal(false);
    setSelectedDevice(null);
  };

  const handleDeleteDevice = async (device: RealDevice) => {
    if (!window.confirm(`Are you sure you want to remove device "${device.name}"?`)) {
      return;
    }

    deleteDevice(device.id);
  };

  const getDeviceIcon = (type: string) => {
    return type === 'check_in_kiosk' ? Monitor : Smartphone;
  };

  const getStatusBadge = (isOnline: boolean) => {
    return isOnline ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading devices...</p>
            <p className="text-sm text-muted-foreground">Fetching device information from database</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <RoleGuard requireAdminAccess>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Device Management</h1>
              <p className="text-muted-foreground">
                Manage check-in kiosks and check-out stations
              </p>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register New Device</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="device_id">Device ID *</Label>
                    <Input
                      id="device_id"
                      placeholder="Unique device identifier"
                      value={newDevice.device_id}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Device Name *</Label>
                    <Input
                      id="name"
                      placeholder="Display name for the device"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Device Type</Label>
                    <Select value={newDevice.type} onValueChange={(value: any) => setNewDevice(prev => ({ ...prev, type: value }))}>
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
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Physical location of the device"
                      value={newDevice.location}
                      onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleAddDevice} disabled={isRegistering} className="flex-1">
                      {isRegistering ? 'Registering...' : 'Register Device'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Device Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Monitor className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Devices</p>
                    <p className="text-2xl font-bold">{devices.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Wifi className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Online</p>
                    <p className="text-2xl font-bold">{devices.filter(d => d.is_online).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Monitor className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-in Kiosks</p>
                    <p className="text-2xl font-bold">{devices.filter(d => d.type === 'check_in_kiosk').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Smartphone className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-out Stations</p>
                    <p className="text-2xl font-bold">{devices.filter(d => d.type === 'check_out_station').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device List */}
          {devices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No devices registered</h3>
                <p className="text-gray-500 mb-4">Register your first device to get started</p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.type);
                return (
                  <Card key={device.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <DeviceIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{device.name}</CardTitle>
                            <p className="text-sm text-gray-600">{device.device_id}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditDevice(device)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteDevice(device)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type</span>
                          <Badge variant="outline" className="capitalize">
                            {device.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          {getStatusBadge(device.is_online)}
                        </div>
                        {device.location && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{device.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Registered: {new Date(device.created_at).toLocaleDateString()}</span>
                        </div>
                        {device.last_seen && (
                          <div className="text-xs text-gray-500">
                            Last seen: {new Date(device.last_seen).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Edit Device Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Device</DialogTitle>
              </DialogHeader>
              {selectedDevice && (
                <div className="space-y-4">
                  <div>
                    <Label>Device ID</Label>
                    <Input value={selectedDevice.device_id} disabled className="bg-gray-100" />
                  </div>
                  <div>
                    <Label htmlFor="edit_name">Device Name</Label>
                    <Input
                      id="edit_name"
                      value={selectedDevice.name}
                      onChange={(e) => setSelectedDevice(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_type">Device Type</Label>
                    <Select 
                      value={selectedDevice.type} 
                      onValueChange={(value: any) => setSelectedDevice(prev => prev ? { ...prev, type: value } : null)}
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
                    <Label htmlFor="edit_location">Location</Label>
                    <Input
                      id="edit_location"
                      value={selectedDevice.location || ''}
                      onChange={(e) => setSelectedDevice(prev => prev ? { ...prev, location: e.target.value } : null)}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateDevice} className="flex-1">
                      Update Device
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </RoleGuard>
    </ModernLayout>
  );
};

export default DeviceManagementPage;
