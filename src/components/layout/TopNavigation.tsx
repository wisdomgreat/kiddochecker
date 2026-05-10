import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User } from "lucide-react";

interface TopNavigationProps {
  className?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ className }) => {
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'teacher': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'parent': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className={`bg-background border-b py-4 px-6 flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-lg font-semibold">
          KiddoChecker
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Badge variant="secondary" className={getRoleBadgeColor()}>
              {userRole?.replace('_', ' ')}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="ghost">Log In</Button>
          </Link>
        )}
      </div>
    </div>
  );
};


