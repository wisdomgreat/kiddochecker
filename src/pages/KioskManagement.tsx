import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Monitor,
  Smartphone,
  QrCode,
  RefreshCcw,
  MoreHorizontal,
  Info,
  Check,
  X,
  Tablet,
  Wifi,
  WifiOff,
  Settings,
  Trash2,
  Power,
  Edit,
} from "lucide-react";

// Device form schema
const deviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["check_in_kiosk", "check_out_station"], {
    required_error: "Device type is required",
  }),
  location: z.string().optional(),
  deviceId: z.string().min(1, "Device ID is required"),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

const KioskManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create form
  const createForm = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      type: "check_in_kiosk",
      location: "",
      deviceId: "",
    },
  });

  // Edit form
  const editForm = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: "",
      type: "check_in_kiosk",
      location: "",
      deviceId: "",
    },
  });

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("device_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        return data || [];
      } catch (error: any) {
        console.error("Error fetching devices:", error);
        toast({
          title: "Error",
          description: "Failed to load devices",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const checkInDevices = devices.filter((device) => device.type === "check_in_kiosk");
  const checkOutDevices = devices.filter((device) => device.type === "check_out_station");

  const handleCreateDevice = async (values: DeviceFormValues) => {
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

      setIsAddOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["devices"] });
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

      setIsEditOpen(false);
      setSelectedDevice(null);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (error: any) {
      console.error("Error updating device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update device",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDevice = async () => {
    try {
      const { error } = await supabase
        .from("device_profiles")
        .delete()
        .eq("id", selectedDevice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Device deleted successfully",
      });

      setIsDeleteOpen(false);
      setSelectedDevice(null);
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    } catch (error: any) {
      console.error("Error deleting device:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (device: any) => {
    setSelectedDevice(device);
    editForm.reset({
      name: device.name,
      type: device.type,
      location: device.location || "",
      deviceId: device.device_id,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (device: any) => {
    setSelectedDevice(device);
    setIsDeleteOpen(true);
  };

  const deviceColumns = [
    {
      key: "name" as const,
      header: "Device Name",
      render: (value: string, item: any) => (
        <div className="font-medium">{value}</div>
      ),
      sortable: true,
    },
    {
      key: "device_id" as const,
      header: "Device ID",
      render: (value: string) => (
        <div className="font-mono text-xs bg-gray-100 p-1 rounded overflow-x-auto max-w-[200px]">
          {value}
        </div>
      ),
    },
    {
      key: "location" as const,
      header: "Location",
      render: (value: string) => <>{value || "Not specified"}</>,
    },
    {
      key: "created_at" as const,
      header: "Registered On",
      render: (value: string) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (_: any, item: any) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => openEditDialog(item)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => openDeleteDialog(item)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const generateRandomDeviceId = () => {
    const uuid = crypto.randomUUID();
    createForm.setValue("deviceId", uuid);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kiosk Management</h1>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register New Device
        </Button>
      </div>

      <Tabs defaultValue="check-in" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="check-in">Check-in Kiosks</TabsTrigger>
          <TabsTrigger value="check-out">Check-out Stations</TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="check-in" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle>Check-in Kiosks</CardTitle>
              <CardDescription>
                Manage devices used for child check-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <RefreshCcw className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Loading devices...</span>
                </div>
              ) : checkInDevices.length === 0 ? (
                <div className="py-8 text-center">
                  <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No check-in kiosks registered
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Register your first check-in kiosk to get started.
                  </p>
                  <Button onClick={() => setIsAddOpen(true)}>
                    Register Kiosk
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={deviceColumns}
                  data={checkInDevices}
                  keyExtractor={(item) => item.id}
                  searchable={false}
                />
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="check-out" className="m-0">
            <CardHeader className="pb-2">
              <CardTitle>Check-out Stations</CardTitle>
              <CardDescription>
                Manage devices used for child check-out.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <RefreshCcw className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2">Loading devices...</span>
                </div>
              ) : checkOutDevices.length === 0 ? (
                <div className="py-8 text-center">
                  <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No check-out stations registered
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Register your first check-out station to get started.
                  </p>
                  <Button onClick={() => setIsAddOpen(true)}>
                    Register Station
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={deviceColumns}
                  data={checkOutDevices}
                  keyExtractor={(item) => item.id}
                  searchable={false}
                />
              )}
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to set up a check-in kiosk or check-out station.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full p-1 mr-2">
                <span className="flex h-5 w-5 items-center justify-center font-medium text-purple-600">1</span>
              </div>
              <div>
                <h3 className="font-medium">Register a device</h3>
                <p className="text-sm text-gray-500">
                  Use the "Register New Device" button to create a new device profile.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full p-1 mr-2">
                <span className="flex h-5 w-5 items-center justify-center font-medium text-purple-600">2</span>
              </div>
              <div>
                <h3 className="font-medium">Set up the physical device</h3>
                <p className="text-sm text-gray-500">
                  Open the check-in or check-out page on the device and enter the device ID.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 rounded-full p-1 mr-2">
                <span className="flex h-5 w-5 items-center justify-center font-medium text-purple-600">3</span>
              </div>
              <div>
                <h3 className="font-medium">Configure printer (if needed)</h3>
                <p className="text-sm text-gray-500">
                  Connect a compatible label printer for name tag printing at check-in.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm">Device registration is automatic once the kiosk is set up.</span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>
              Register a new check-in kiosk or check-out station.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateDevice)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Entrance Kiosk" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give this device a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                        <SelectItem value="check_out_station">Check-out Station</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The purpose of this device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Lobby" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where this device is physically located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device ID</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="Device identifier" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomDeviceId}
                        className="flex-shrink-0"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      Unique identifier for this device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Register Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditDevice)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Entrance Kiosk" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give this device a descriptive name
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="check_in_kiosk">Check-in Kiosk</SelectItem>
                        <SelectItem value="check_out_station">Check-out Station</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The purpose of this device
                    </FormDescription>
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
                      <Input placeholder="e.g., Main Lobby" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where this device is physically located
                    </FormDescription>
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
                      <Input placeholder="Device identifier" {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Device identifier cannot be changed after registration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Device</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div>
                <h4 className="font-medium text-red-800">{selectedDevice?.name}</h4>
                <p className="text-sm text-red-700">
                  Type: {selectedDevice?.type === "check_in_kiosk" ? "Check-in Kiosk" : "Check-out Station"}
                </p>
                <p className="text-sm text-red-700">
                  ID: {selectedDevice?.device_id}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteDevice}
            >
              Delete Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default KioskManagement;
