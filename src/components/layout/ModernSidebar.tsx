
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useDashboardNavigation } from '@/hooks/use-dashboard-navigation';
import { useManagementNavigation } from '@/hooks/useManagementNavigation';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Settings, 
  BarChart3,
  UserCheck,
  LogOut,
  Plus,
  Monitor,
  QrCode
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const ModernSidebar = () => {
  const { user, userRole, logout } = useAuth();
  const { navigateToDashboard } = useDashboardNavigation();
  const { navigateToManagement } = useManagementNavigation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-dashboard' },
    { icon: Users, label: 'Users', path: '/users-management' },
    { icon: Users, label: 'Staff', path: '/staff-management' },
    { icon: GraduationCap, label: 'Classes', path: '/classes-management' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const staffNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/staff-dashboard' },
    { icon: Monitor, label: 'Live View', path: '/staff-realtime' },
    { icon: QrCode, label: 'Check-out Station', path: '/check-out-station' },
    { icon: UserCheck, label: 'Attendance', path: '/check-in-out' },
    { icon: GraduationCap, label: 'Classes', path: '/classes-management' },
  ];

  const parentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/parent-dashboard' },
    { icon: Users, label: 'My Children', path: '/children' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const getNavItems = () => {
    if (userRole === 'admin' || userRole === 'super_admin') return adminNavItems;
    if (userRole === 'staff' || userRole === 'teacher' || userRole === 'teacher_assistant') return staffNavItems;
    return parentNavItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Plus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">ChurchCheck</h1>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Quick Access Section */}
      <div className="px-4 py-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Access</p>
        <div className="space-y-2">
          <NavLink
            to="/check-in-kiosk"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            Check-in Kiosk
          </NavLink>
          {(userRole === 'admin' || userRole === 'staff') && (
            <NavLink
              to="/check-out-station"
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <QrCode className="h-4 w-4" />
              Check-out Station
            </NavLink>
          )}
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="w-full justify-start text-gray-700 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ModernSidebar;
