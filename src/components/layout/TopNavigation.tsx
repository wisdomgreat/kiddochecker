
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Baby,
  Monitor,
  UserCheck,
  Building,
  Menu,
  User
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

export function TopNavigation() {
  const { signOut, userRole, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    // Admin items
    { 
      name: "Dashboard", 
      href: "/admin-dashboard", 
      icon: Home, 
      roles: ['admin', 'super_admin']
    },
    { 
      name: "Users", 
      href: "/users-management", 
      icon: Users, 
      roles: ['admin', 'super_admin']
    },
    { 
      name: "Staff", 
      href: "/staff-management", 
      icon: UserCheck, 
      roles: ['admin', 'super_admin']
    },
    { 
      name: "Classes", 
      href: "/classes-management", 
      icon: BookOpen, 
      roles: ['admin', 'super_admin']
    },
    { 
      name: "Devices", 
      href: "/device-management", 
      icon: Monitor, 
      roles: ['admin', 'super_admin']
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings, 
      roles: ['admin', 'super_admin']
    },
    
    // Staff items
    { 
      name: "Dashboard", 
      href: "/staff-dashboard", 
      icon: Home, 
      roles: ['staff', 'teacher', 'teacher_assistant']
    },
    { 
      name: "Check-In/Out", 
      href: "/check-in-out", 
      icon: ClipboardCheck, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant']
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: BarChart3, 
      roles: ['admin', 'super_admin', 'staff', 'teacher']
    },
    
    // Parent items
    { 
      name: "Dashboard", 
      href: "/parent-dashboard", 
      icon: Home, 
      roles: ['parent']
    },
    { 
      name: "My Children", 
      href: "/children-management", 
      icon: Baby, 
      roles: ['parent']
    },
    
    // Common items
    { 
      name: "Calendar", 
      href: "/calendar", 
      icon: Calendar, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent']
    },
    { 
      name: "Messages", 
      href: "/family-connect", 
      icon: MessageSquare, 
      roles: ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'parent']
    },
  ];

  const allowedItems = navigationItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href);

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'teacher':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'teacher_assistant':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'parent':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-gray-900">KiddoChecker</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Button
                  key={item.href}
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item.href)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={getRoleBadgeColor()}>
              {userRole?.replace('_', ' ').toUpperCase()}
            </Badge>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
