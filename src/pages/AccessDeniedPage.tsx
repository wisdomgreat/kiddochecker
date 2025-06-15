
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, Home, LogOut } from "lucide-react";

const AccessDeniedPage = () => {
  const { signOut, userRole } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ShieldX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this resource with your current role: 
            <span className="font-semibold ml-1 capitalize">
              {userRole?.replace('_', ' ')}
            </span>
          </p>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
            
            {userRole === 'admin' && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Admin accounts cannot access parent features. 
                  If you need to manage your children, please use a separate parent account.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 pt-4">
            <Link to="/">
              <Button variant="default" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
