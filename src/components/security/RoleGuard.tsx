
import { ReactNode } from "react";
import { useAuth } from "@/context/CleanAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  requireAdminAccess?: boolean;
  requireParentAccess?: boolean;
  fallback?: ReactNode;
}

const RoleGuard = ({ children, requireAdminAccess, requireParentAccess, fallback }: RoleGuardProps) => {
  const { userRole, loading, isAdmin, isParent } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAdminAccess && !isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this area.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireParentAccess && !isParent) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">This area is only accessible to parents.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
