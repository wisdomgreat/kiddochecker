import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

const CalendarPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Events and schedules</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CalendarPage;
