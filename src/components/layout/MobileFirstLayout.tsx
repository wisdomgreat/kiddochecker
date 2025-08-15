
import { ReactNode, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, Users, Calendar, MessageSquare, Settings, BarChart3, Baby, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileFirstLayoutProps {
  children: ReactNode;
}

const MobileFirstLayout = ({ children }: MobileFirstLayoutProps) => {
  const { user, userRole, loading, isAdmin, isParent, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin navigation items
  const adminNavItems = [
    { name: "Dashboard", href: "/admin-dashboard", icon: Home },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  // Parent navigation items
  const parentNavItems = [
    { name: "Dashboard", href: "/parent-dashboard", icon: Home },
    { name: "Children", href: "/parent/children", icon: Baby },
    { name: "Attendance", href: "/parent/attendance", icon: Calendar },
    { name: "Messages", href: "/parent/messages", icon: MessageSquare },
  ];

  const navItems = isAdmin ? adminNavItems : parentNavItems;

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-background border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold">KiddoChecker</h1>
          </div>
          <Badge variant="outline" className={getRoleBadgeColor()}>
            {userRole?.replace('_', ' ')}
          </Badge>
        </div>
      </header>

      <div className="flex min-h-screen lg:min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-muted/30 lg:border-r lg:border-border">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold">KiddoChecker</h1>
            <div className="mt-2">
              <Badge variant="outline" className={getRoleBadgeColor()}>
                {userRole?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-border">
            <div className="mb-3">
              <p className="text-sm text-left text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium text-left truncate">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full justify-start text-left">
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-64 bg-background border-r border-border">
              <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-left">KiddoChecker</h1>
                <div className="mt-2">
                  <Badge variant="outline" className={getRoleBadgeColor()}>
                    {userRole?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              <div className="p-4 border-t border-border">
                <div className="mb-3">
                  <p className="text-sm text-left text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium text-left truncate">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full justify-start text-left">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MobileFirstLayout;
