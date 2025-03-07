
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pxqztqcukuilqdermblq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cXp0cWN1a3VpbHFkZXJtYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzYwODgsImV4cCI6MjA1NjQxMjA4OH0.2mZ8Dn2DX5SAQw2dHwPdHy6bQK5OhNTVI-1HVvXXlOs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
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

export const getUserRole = async () => {
  try {
    const user = await getCurrentUser();
    
    if (!user) return null;
    
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
      
    return roleData?.role || null;
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return null;
  }
};
