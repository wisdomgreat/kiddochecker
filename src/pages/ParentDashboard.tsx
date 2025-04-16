
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpcomingEventsList from "@/components/dashboard/UpcomingEventsList";
import ChildrenManagement from "@/components/children/ChildrenManagement";
import { Clock, CalendarCheck, Users } from "lucide-react";

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState("children");
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parent Dashboard</h1>
        <div className="flex gap-3">
          <Button variant="outline">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Check-in
          </Button>
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            View History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="children" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Children
              </TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="children">
                <ChildrenManagement />
              </TabsContent>
              
              <TabsContent value="attendance">
                <div className="bg-gray-50 rounded-md p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance History</h3>
                  <p className="text-gray-500">View your children's attendance history.</p>
                  <Button className="mt-4" variant="outline">Coming Soon</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="classes">
                <div className="bg-gray-50 rounded-md p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Class Information</h3>
                  <p className="text-gray-500">View information about your children's classes.</p>
                  <Button className="mt-4" variant="outline">Coming Soon</Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <div>
          <UpcomingEventsList />
        </div>
      </div>
    </MainLayout>
  );
};

export default ParentDashboard;
