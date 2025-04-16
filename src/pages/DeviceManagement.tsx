
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DeviceProfile } from "@/types/supabase";
import { Laptop, Smartphone, Monitor, RefreshCcw, Printer, QrCode } from "lucide-react";

// Define schema for the device form
const deviceSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  type: z.enum(["check_in_kiosk", "check_out_station"], {
    required_error: "Please select a device type",
  }),
  location: z.string().optional(),
  deviceId: z.string().min(6, { message: "Device ID must be at least 6 characters" }),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

const DeviceManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["device-profiles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("device_profiles")
          .select("*");

        if (error) throw error;

        return data.map((device: any) => ({
          id: device.id,
          deviceId: device.device_id,
          name: device.name,
          type: device.type,
          location: device.location,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        })) as DeviceProfile[];
      } catch (error: any) {
        console.error("Error fetching device profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load device profiles",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const addForm = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      type: "check_in_kiosk",
      location: "",
      deviceId: "",
    },
  });

  const editForm = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      type: "check_in_kiosk",
      location: "",
      deviceId: "",
    },
  });

  useEffect(() => {
    if (selectedDevice) {
      editForm.reset({
        name: selectedDevice.name,
        type: selectedDevice.type as "check_in_kiosk" | "check_out_station",
        location: selectedDevice.location || "",
        deviceId: selectedDevice.deviceId,
      });
    }
  }, [selectedDevice, editForm]);

  const handleAddDevice = async (values: DeviceFormValues) => {
    try {
      const { data, error } = await supabase.rpc("register_device", {
        p_device_id: values.deviceId,
        p_name: values.name,
        p_type: values.type,
        p_location: values.location || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device registered successfully",
      });

      setIsAddDialogOpen(false);
      addForm.reset();
      queryClient.invalidateQueries({ queryKey: ["device-profiles"] });
    } catch (error: any) {
      console.error("Error registering device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register device",
        variant: "destructive",
      });
    }
  };

  const handleEditDevice = async (values: DeviceFormValues) => {
    if (!selectedDevice) return;

    try {
      const { data, error } = await supabase.rpc("register_device", {
        p_device_id: values.deviceId,
        p_name: values.name,
        p_type: values.type,
        p_location: values.location || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedDevice(null);
      queryClient.invalidateQueries({ queryKey: ["device-profiles"] });
    } catch (error: any) {
      console.error("Error updating device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update device",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from("device_profiles")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["device-profiles"] });
    } catch (error: any) {
      console.error("Error deleting device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const deviceColumns = [
    {
      key: "name" as const,
      header: "Device Name",
      render: (value: string, item: DeviceProfile) => (
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            item.type === "check_in_kiosk" ? "bg-blue-100" : "bg-green-100"
          }`}>
            {item.type === "check_in_kiosk" ? (
              <Monitor className="h-5 w-5 text-blue-600" />
            ) : (
              <Laptop className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-500">
              {item.type === "check_in_kiosk" ? "Check-in Kiosk" : "Check-out Station"}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "deviceId" as const,
      header: "Device ID",
      render: (value: string) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: "location" as const,
      header: "Location",
      render: (value: string) => value || "Not specified",
    },
    {
      key: "createdAt" as const,
      header: "Registered On",
      render: (value: string) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, item: DeviceProfile) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedDevice(item);
              setIsEditDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDeleteDevice(item.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const printerColumns = [
    {
      key: "name" as const,
      header: "Printer Name",
      render: (value: string) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-purple-100">
            <Printer className="h-5 w-5 text-purple-600" />
          </div>
          <div className="font-medium">{value}</div>
        </div>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (value: string) => (
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "connected" 
            ? "bg-green-100 text-green-800" 
            : "bg-amber-100 text-amber-800"
        }`}>
          {value === "connected" ? "Connected" : "Disconnected"}
        </div>
      ),
    },
    {
      key: "ip" as const,
      header: "IP Address",
      render: (value: string) => <span className="font-mono text-sm">{value}</span>,
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Test Print</Button>
          <Button variant="outline" size="sm">Configure</Button>
        </div>
      ),
    },
  ];

  // Mock printer data - would connect to system printers in production
  const printers = [
    { id: "1", name: "Label Printer", status: "connected", ip: "192.168.1.101" },
    { id: "2", name: "Name Tag Printer", status: "disconnected", ip: "192.168.1.102" },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Device Management</h1>
          <p className="text-gray-500">Manage kiosks, stations, and printers</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add New Device
        </Button>
      </div>

      <Tabs defaultValue="kiosks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kiosks">
            <Monitor className="h-4 w-4 mr-2" />
            Kiosks & Stations
          </TabsTrigger>
          <TabsTrigger value="printers">
            <Printer className="h-4 w-4 mr-2" />
            Printers
          </TabsTrigger>
        </TabsList>

        {/* Kiosks & Stations Tab */}
        <TabsContent value="kiosks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-600 flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Check-in Kiosks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {devices.filter(d => d.type === "check_in_kiosk").length}
                </div>
                <p className="text-sm text-gray-500">Registered devices</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-green-600 flex items-center">
                  <Laptop className="h-5 w-5 mr-2" />
                  Check-out Stations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {devices.filter(d => d.type === "check_out_station").length}
                </div>
                <p className="text-sm text-gray-500">Registered devices</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-600 flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {/* In a real app, you'd count tags from the database */}
                  --
                </div>
                <p className="text-sm text-gray-500">Active tags</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>
                Manage check-in kiosks and check-out stations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <RefreshCcw className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Loading devices...</span>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No devices registered</h3>
                  <p className="mt-1 text-gray-500">
                    Get started by registering your first device
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    Register Device
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={deviceColumns}
                  data={devices}
                  keyExtractor={(item) => item.id}
                />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Device Registration Guide</CardTitle>
              <CardDescription>
                How to register a new kiosk or check-out station
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 1: Generate a Device ID</h3>
                <p className="text-gray-600">
                  Each device needs a unique identifier. You can use the device's serial number or generate a UUID.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 2: Register the Device</h3>
                <p className="text-gray-600">
                  Add the device using the "Add New Device" button and enter the device information.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 3: Configure the Device</h3>
                <p className="text-gray-600">
                  Open the KidCheck application on the device and enter the Device ID in the settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Printers Tab */}
        <TabsContent value="printers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-600 flex items-center">
                  <Printer className="h-5 w-5 mr-2" />
                  Connected Printers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {printers.filter(p => p.status === "connected").length}
                </div>
                <p className="text-sm text-gray-500">Ready to print</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Print Test QR Code</CardTitle>
                  <Button size="sm">
                    <QrCode className="h-4 w-4 mr-2" />
                    Print Test
                  </Button>
                </div>
                <CardDescription>
                  Test your printer configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-gray-600">
                  Print a test QR code to verify your printer is properly configured.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Connected Printers</CardTitle>
              <CardDescription>
                Manage printers used for name tags and QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={printerColumns}
                data={printers}
                keyExtractor={(item) => item.id}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Printer Setup Guide</CardTitle>
              <CardDescription>
                How to connect and configure printers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 1: Connect your printer</h3>
                <p className="text-gray-600">
                  Ensure your printer is connected to the same network as your kiosk device.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 2: Install printer drivers</h3>
                <p className="text-gray-600">
                  Make sure appropriate drivers are installed on the kiosk device.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 3: Configure printer settings</h3>
                <p className="text-gray-600">
                  Adjust paper size, resolution and other settings for optimal tag printing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>
              Add a new check-in kiosk or check-out station
            </DialogDescription>
          </DialogHeader>

          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddDevice)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Entrance Kiosk" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name to identify this device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID</FormLabel>
                    <FormControl>
                      <Input placeholder="device-123456" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for this device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                        <SelectItem value="check_out_station">Check-out Station</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What this device will be used for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Entrance" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where this device is physically located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Register Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditDevice)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormDescription>
                      Device ID cannot be changed after registration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                        <SelectItem value="check_out_station">Check-out Station</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DeviceManagement;
