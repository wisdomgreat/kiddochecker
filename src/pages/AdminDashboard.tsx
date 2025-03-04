
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users, School, PieChart, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import StatCards from "@/components/dashboard/StatCards";
import ClassStatus from "@/components/dashboard/ClassStatus";
import ActivityTable from "@/components/dashboard/ActivityTable";
import AlertsPanel from "@/components/dashboard/AlertsPanel";

const AdminDashboard = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        setIsSuperAdmin(data?.is_super_admin || false);
      } catch (error) {
        console.error("Error checking super admin status:", error);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <Link to="/staff-management">
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Manage Staff
              </Button>
            </Link>
          )}
          <Link to="/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <StatCards />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2">
          <ClassStatus />
        </div>
        <div>
          <AlertsPanel />
        </div>
      </div>
      
      <div className="mt-6">
        <ActivityTable />
      </div>
      
      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Link to="/users-management">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <Users className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <h3 className="font-medium">User Management</h3>
                <p className="text-sm text-gray-500">Manage families and children</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/classes-management">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <School className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <h3 className="font-medium">Classes</h3>
                <p className="text-sm text-gray-500">Organize classes and teachers</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/reports-dashboard">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <PieChart className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <h3 className="font-medium">Reports</h3>
                <p className="text-sm text-gray-500">View attendance reports</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/check-in-kiosk">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <LogOut className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <h3 className="font-medium">Check-in Kiosk</h3>
                <p className="text-sm text-gray-500">Open the check-in screen</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
