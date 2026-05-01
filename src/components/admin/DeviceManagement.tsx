
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Monitor, Plus, Search, Wifi, WifiOff } from "lucide-react";
import { useRealDevices } from "@/hooks/useRealDevices";

const DeviceManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { devices, isLoading } = useRealDevices();

  const filteredDevices = devices.filter(device => 
    searchTerm === '' || 
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Device Management</h2>
          <p className="text-gray-600">Manage check-in kiosks and devices</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Device
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            Registered Devices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">Loading devices...</div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No devices found
              </div>
            ) : (
              filteredDevices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-gray-600">{device.location}</p>
                      <p className="text-xs text-gray-500">ID: {device.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={device.is_online ? "default" : "secondary"}>
                      {device.is_online ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" />
                          Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {device.type.replace('_', ' ')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceManagement;

