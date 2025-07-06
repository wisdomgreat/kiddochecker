
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Users, 
  UserPlus, 
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
  Building
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isTeacher = userRole === 'teacher' || userRole === 'teacher_assistant' || userRole === 'staff';
  const isParent = userRole === 'parent';

  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/", icon: Home, roles: ['all'] },
    ];

    const adminItems = [
      { name: "User Management", href: "/users-management", icon: Users, roles: ['admin', 'super_admin'] },
      { name: "Staff Management", href: "/staff-management", icon: UserCheck, roles: ['admin', 'super_admin'] },
      { name: "Classes Management", href: "/classes-management", icon: BookOpen, roles: ['admin', 'super_admin'] },
      { name: "Organization Setup", href: "/organization-setup", icon: Building, roles: ['admin', 'super_admin'] },
    ];

    const commonItems = [
      { name: "Check-In/Out", href: "/check-in-out", icon: ClipboardCheck, roles: ['admin', 'super_admin', 'teacher', 'teacher_assistant', 'staff', 'parent'] },
      { name: "Calendar", href: "/calendar", icon: Calendar, roles: ['all'] },
      { name: "Family Connect", href: "/family-connect", icon: MessageSquare, roles: ['all'] },
      { name: "Reports", href: "/reports", icon: BarChart3, roles: ['admin', 'super_admin', 'teacher'] },
      { name: "Settings", href: "/settings", icon: Settings, roles: ['admin', 'super_admin'] },
    ];

    const parentItems = [
      { name: "My Children", href: "/children-management", icon: Baby, roles: ['parent'] },
    ];

    let items = [...baseItems];

    if (isAdmin) {
      items = [...items, ...adminItems];
    }

    if (isTeacher) {
      items = [...items, ...adminItems.filter(item => 
        item.roles.includes('teacher') || 
        item.roles.includes('teacher_assistant') || 
        item.roles.includes('staff')
      )];
    }

    if (isParent) {
      items = [...items, ...parentItems];
    }

    items = [...items, ...commonItems];

    return items.filter(item => 
      item.roles.includes('all') || 
      item.roles.includes(userRole || '')
    );
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6" />
          <span>KiddoChecker</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive(item.href) && "bg-muted text-primary"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
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

export default Sidebar;
