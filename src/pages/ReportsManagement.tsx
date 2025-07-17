
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const ReportsManagement = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate reports and view analytics</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Reports and analytics features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default ReportsManagement;
