
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/CleanAuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Shield,
  Clock,
  Baby,
  Monitor,
  UserCheck,
  Building,
  AlertTriangle,
  Eye
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
  adminOnly?: boolean;
  parentOnly?: boolean;
}

const EnhancedSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const canAccessAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canAccessParent = userRole === 'parent';

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { name: "Dashboard", href: "/", icon: Home, roles: ['all'] },
    ];

    const adminItems: NavigationItem[] = [
      { 
        name: "User Management", 
        href: "/users-management", 
        icon: Users, 
        adminOnly: true 
      },
      { 
        name: "Staff Management", 
        href: "/staff-management", 
        icon: UserCheck, 
        adminOnly: true 
      },
      { 
        name: "Classes Management", 
        href: "/classes-management", 
        icon: BookOpen, 
        adminOnly: true 
      },
      { 
        name: "Organization Setup", 
        href: "/organization-setup", 
        icon: Building, 
        adminOnly: true 
      },
      { 
        name: "Settings", 
        href: "/settings", 
        icon: Settings, 
        adminOnly: true 
      },
    ];

    const commonItems: NavigationItem[] = [
      { 
        name: "Check-In/Out", 
        href: "/check-in-out", 
        icon: ClipboardCheck, 
        roles: ['admin', 'staff', 'teacher', 'super_admin'] 
      },
      { 
        name: "Calendar", 
        href: "/calendar", 
        icon: Calendar, 
        roles: ['all'] 
      },
      { 
        name: "Family Connect", 
        href: "/family-connect", 
        icon: MessageSquare, 
        roles: ['all'] 
      },
      { 
        name: "Reports", 
        href: "/reports", 
        icon: BarChart3, 
        roles: ['admin', 'super_admin', 'teacher', 'staff'] 
      },
    ];

    const parentItems: NavigationItem[] = [
      { 
        name: "My Children", 
        href: "/children-management", 
        icon: Baby, 
        parentOnly: true 
      },
    ];

    let items: NavigationItem[] = [...baseItems];

    // Add admin items only if user has admin access
    if (canAccessAdmin) {
      items = [...items, ...adminItems];
    }

    // Add parent items only if user has parent access
    if (canAccessParent) {
      items = [...items, ...parentItems];
    }

    // Add common items based on roles
    items = [...items, ...commonItems.filter(item => {
      if (item.roles?.includes('all')) return true;
      if (item.roles?.includes(userRole || '')) return true;
      return false;
    })];

    return items.filter(item => {
      // Filter out admin-only items for non-admin users
      if (item.adminOnly && !canAccessAdmin) return false;
      // Filter out parent-only items for non-parent users
      if (item.parentOnly && !canAccessParent) return false;
      return true;
    });
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'teacher_assistant':
        return 'bg-teal-100 text-teal-800';
      case 'parent':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNavigation = (href: string) => {
    console.log('Navigating to:', href);
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <button 
          onClick={() => handleNavigation('/')} 
          className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        >
          <BookOpen className="h-6 w-6" />
          <span>Admin Panel</span>
        </button>
      </div>
      
      {/* Role indicator */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Current Role:</span>
          <Badge variant="outline" className={getRoleBadgeColor()}>
            {userRole?.replace('_', ' ')}
          </Badge>
        </div>
        {userRole === 'admin' && !canAccessParent && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700">
              Admin accounts cannot access parent features
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left",
                  isActive(item.href) && "bg-muted text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
                {item.adminOnly && (
                  <Badge variant="outline" className="ml-auto text-xs bg-red-50 text-red-600">
                    Admin
                  </Badge>
                )}
                {item.parentOnly && (
                  <Badge variant="outline" className="ml-auto text-xs bg-amber-50 text-amber-600">
                    Parent
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 w-64">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default EnhancedSidebar;
