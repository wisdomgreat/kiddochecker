import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/CleanAuthContext";
import { Navigate } from "react-router-dom";
import { BookOpen, Users, Calendar, FileText } from "lucide-react";

const TeacherDashboard = () => {
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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BookOpen className="mr-2 h-4 w-4" /> Classes</CardTitle>
            </CardHeader>
            <CardContent>
              Manage your classes and student assignments.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Users className="mr-2 h-4 w-4" /> Students</CardTitle>
            </CardHeader>
            <CardContent>
              View and manage your students' profiles.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              Keep track of important dates and events.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><FileText className="mr-2 h-4 w-4" /> Reports</CardTitle>
            </CardHeader>
            <CardContent>
              Generate reports on student performance.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;

