import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/CleanAuthContext";
import { Navigate } from "react-router-dom";
import { Users, CheckCircle, Calendar, MessageSquare } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const StaffDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Users className="mr-2 h-4 w-4" /> Manage Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>View and manage user accounts.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Check-in/Check-out</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Manage attendance tracking.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>View events and schedules.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Send and receive messages.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default StaffDashboard;

