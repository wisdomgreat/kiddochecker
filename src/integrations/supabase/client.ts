import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AppRole, CustomRole, Permission, RolePermission } from '@/types/supabase';

const SUPABASE_URL = "https://pxqztqcukuilqdermblq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cXp0cWN1a3VpbHFkZXJtYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzYwODgsImV4cCI6MjA1NjQxMjA4OH0.2mZ8Dn2DX5SAQw2dHwPdHy6bQK5OhNTVI-1HVvXXlOs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper functions for session management
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getCurrentUserWithProfile = async () => {
  try {
    const user = await getCurrentUser();
    
    if (!user) return null;
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return { user, profile: null };
    }
      
    return { user, profile };
  } catch (error) {
    console.error("Error in getCurrentUserWithProfile:", error);
    return null;
  }
};

export const getUserRole = async (): Promise<AppRole | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("getUserRole: No authenticated user found");
      return null;
    }
    
    console.log("Getting role for user:", user.id);
    
    // Use the security definer function to get user role
    const { data, error } = await supabase.rpc('get_current_user_role');
      
    if (error) {
      console.error("Error fetching user role:", error);
      return 'parent'; // Default role on error
    }
    
    console.log("Fetched role data:", data);
    return (data as AppRole) || 'parent';
    
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return 'parent'; // Default to parent role
  }
};

// Custom roles and permissions functions
export const getCustomRoles = async (): Promise<CustomRole[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_roles')
      .select('*')
      .order('name');
      
    if (error) {
      console.error("Error fetching custom roles:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getCustomRoles:", error);
    return [];
  }
};

export const getPermissions = async (): Promise<Permission[]> => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name');
      
    if (error) {
      console.error("Error fetching permissions:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getPermissions:", error);
    return [];
  }
};

export const getRolePermissions = async (): Promise<RolePermission[]> => {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*');
      
    if (error) {
      console.error("Error fetching role permissions:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getRolePermissions:", error);
    return [];
  }
};

// Check if a device is registered as a kiosk
export const getDeviceProfile = async (deviceId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_device_profile', {
      p_device_id: deviceId
    });
      
    if (error) {
      console.error("Error fetching device profile:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getDeviceProfile:", error);
    return null;
  }
};

// Register a device as a kiosk
export const registerDevice = async (deviceInfo: {
  device_id: string;
  name: string;
  type: 'check_in_kiosk' | 'check_out_station';
  location?: string;
}) => {
  try {
    const { data, error } = await supabase.rpc('register_device', {
      p_device_id: deviceInfo.device_id,
      p_name: deviceInfo.name,
      p_type: deviceInfo.type,
      p_location: deviceInfo.location || null
    });
      
    if (error) {
      console.error("Error registering device:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in registerDevice:", error);
    return null;
  }
};

// Check if setup is completed (organization exists)
export const isSetupCompleted = async () => {
  try {
    const { count, error } = await supabase
      .from('organization_settings')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error("Error checking setup status:", error);
      return false;
    }
    
    const setupComplete = count ? count > 0 : false;
    console.log("Setup completed:", setupComplete);
    return setupComplete;
  } catch (error) {
    console.error("Error in isSetupCompleted:", error);
    return false;
  }
};

// Check if user has specific permission
export const checkUserPermission = async (resource: string, action: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) return false;
    
    // Check if the user is an admin (has all permissions)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('is_super_admin, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();
      
    if (roleData?.is_super_admin || roleData?.role === 'super_admin') {
      return true;
    }
    
    // Check specific permission
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions:permission_id (
          resource,
          action
        )
      `)
      .eq('permissions.resource', resource)
      .eq('permissions.action', action);
    
    if (error) {
      console.error("Error checking permission:", error);
      return false;
    }
    
    return (data && data.length > 0) || false;
  } catch (error) {
    console.error("Error in checkUserPermission:", error);
    return false;
  }
};
