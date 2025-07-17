
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

const AttendanceManagement = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track daily attendance and check-in/out</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Attendance management features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default AttendanceManagement;
