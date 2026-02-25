
-- This migration fixes potential infinite recursion issues with Row Level Security (RLS)
-- policies on the `profiles` and `user_roles` tables. It replaces any existing policies
-- with a new set of safe and secure rules.

-- Drop all existing RLS policies on `profiles` and `user_roles` to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for INSERT" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for UPDATE" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles for DELETE" ON public.user_roles;
-- This policy from a previous migration is too permissive and will be replaced.
DROP POLICY IF EXISTS "System functions bypass RLS for user_roles" ON public.user_roles;


-- Enable RLS on both tables if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


-- == Policies for `profiles` table ==

-- A user can view and update their own profile.
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can perform any action on any profile.
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));


-- == Policies for `user_roles` table ==

-- Any user can read their own role. This is crucial to prevent recursion for admins.
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all user roles.
-- This is safe because when `get_current_user_role()` is called for an admin,
-- the "Users can view their own role" policy allows the function to read the admin's own role.
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));

-- Only admins can insert, update, or delete roles.
CREATE POLICY "Admins can manage user roles for INSERT"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage user roles for UPDATE"
  ON public.user_roles FOR UPDATE
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage user roles for DELETE"
  ON public.user_roles FOR DELETE
  USING (public.get_current_user_role() IN ('admin', 'super_admin'));

