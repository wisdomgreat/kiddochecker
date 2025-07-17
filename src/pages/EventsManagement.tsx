
import ModernLayout from "@/components/layout/ModernLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

const EventsManagement = () => {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Events Management</h1>
            <p className="text-muted-foreground">Manage events, activities, and calendar</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Events management features coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
};

export default EventsManagement;
