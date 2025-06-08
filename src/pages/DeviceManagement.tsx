
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Plus } from 'lucide-react';

const DeviceManagement = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Device Management</h1>
            <p className="text-muted-foreground">
              Manage check-in kiosks and other devices.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No devices registered yet</p>
              <p className="text-sm text-muted-foreground">Register your first device to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DeviceManagement;
