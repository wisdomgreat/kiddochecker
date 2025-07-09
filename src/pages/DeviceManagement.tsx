
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDevices } from "@/hooks/useDevices";
import { Monitor, Plus, Search, Wifi, WifiOff } from "lucide-react";
import SimpleLayout from "@/components/layout/SimpleLayout";

const DeviceManagement = () => {
  const { devices, isLoading, registerDevice, isRegistering } = useDevices();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    type: 'check_in_kiosk' as 'check_in_kiosk' | 'check_out_station',
    location: ''
  });

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDevice = async () => {
    if (!newDevice.device_id || !newDevice.name) return;

    registerDevice(newDevice);
    setNewDevice({
      device_id: '',
      name: '',
      type: 'check_in_kiosk',
      location: ''
    });
    setShowAddForm(false);
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'check_in_kiosk':
        return 'bg-green-100 text-green-800';
      case 'check_out_station':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-2">Manage check-in kiosks and check-out stations</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Device Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Device</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Device ID</label>
                  <Input
                    placeholder="Enter device ID"
                    value={newDevice.device_id}
                    onChange={(e) => setNewDevice({...newDevice, device_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Device Name</label>
                  <Input
                    placeholder="Enter device name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({...newDevice, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="check_in_kiosk">Check-in Kiosk</option>
                    <option value="check_out_station">Check-out Station</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter location"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({...newDevice, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddDevice} disabled={isRegistering}>
                  {isRegistering ? 'Adding...' : 'Add Device'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                  </div>
                  <Wifi className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">ID: {device.device_id}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDeviceTypeColor(device.type)}>
                      {device.type === 'check_in_kiosk' ? 'Check-in Kiosk' : 'Check-out Station'}
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Online
                    </Badge>
                  </div>
                  {device.location && (
                    <p className="text-sm text-gray-600">
                      <strong>Location:</strong> {device.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(device.updated_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDevices.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No devices found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SimpleLayout>
  );
};

export default DeviceManagement;
