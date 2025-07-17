
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

const OrganizationSettings = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Configure organization preferences and branding</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Organization settings features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default OrganizationSettings;
