import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  BarChart3,
  Baby,
  UserCheck,
  Building
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const WorkingSidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      roles: ["admin", "teacher", "parent", "staff", "volunteer"],
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Children",
      href: "/children",
      icon: Baby,
      roles: ["parent"],
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: Calendar,
      roles: ["teacher", "staff"],
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      roles: ["parent", "teacher", "staff"],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      name: "Staff",
      href: "/staff",
      icon: UserCheck,
      roles: ["admin"],
    },
    {
      name: "Organization",
      href: "/organization",
      icon: Building,
      roles: ["admin"],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles?.includes(userRole || "")
  );

  const isActive = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'teacher_assistant': return 'bg-teal-100 text-teal-800';
      case 'parent': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <div className="flex h-14 items-center border-b px-4">
            <Link to="/" className="mr-auto font-semibold">
              Admin Panel
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-4 py-2 border-b">
            <Badge variant="outline" className={getRoleBadgeColor()}>
              {userRole?.replace('_', ' ')}
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col space-y-1 p-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "justify-start px-2 py-1.5 font-medium",
                      isActive(item.href)
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    asChild
                  >
                    <Link to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-gray-100/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 w-60">
          <div className="flex h-14 items-center border-b px-4">
            <Link to="/" className="mr-auto font-semibold">
              Admin Panel
            </Link>
          </div>
          <div className="px-4 py-2 border-b">
            <Badge variant="outline" className={getRoleBadgeColor()}>
              {userRole?.replace('_', ' ')}
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col space-y-1 p-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "justify-start px-2 py-1.5 font-medium",
                      isActive(item.href)
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    asChild
                  >
                    <Link to={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
          <div className="p-4">
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
      </div>
    </>
  );
};

export default WorkingSidebar;


