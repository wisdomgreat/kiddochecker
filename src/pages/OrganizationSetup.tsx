
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building, Save } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const OrganizationSetup = () => {
  const { toast } = useToast();
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#6366f1',
    logoUrl: ''
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Organization settings have been updated successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Setup</h1>
            <p className="text-muted-foreground">
              Configure your organization settings and branding.
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  placeholder="Enter organization name"
                  value={orgData.name}
                  onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Enter address"
                  value={orgData.address}
                  onChange={(e) => setOrgData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  placeholder="Enter phone number"
                  value={orgData.phone}
                  onChange={(e) => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={orgData.email}
                  onChange={(e) => setOrgData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={orgData.primaryColor}
                    onChange={(e) => setOrgData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    placeholder="#6366f1"
                    value={orgData.primaryColor}
                    onChange={(e) => setOrgData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Logo URL</label>
                <Input
                  placeholder="Enter logo URL"
                  value={orgData.logoUrl}
                  onChange={(e) => setOrgData(prev => ({ ...prev, logoUrl: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationSetup;

