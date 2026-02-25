
-- Clear all organization and user data
-- Note: This will remove ALL data from the database, use with caution

-- Delete attendance records first (has foreign keys)
DELETE FROM public.attendance;

-- Delete teacher assignments
DELETE FROM public.teachers;

-- Delete parent-children relationships
DELETE FROM public.parent_children;

-- Delete children records
DELETE FROM public.children;

-- Delete classes
DELETE FROM public.classes;

-- Delete messages
DELETE FROM public.messages;

-- Delete calendar events
DELETE FROM public.calendar_events;

-- Delete events
DELETE FROM public.events;

-- Delete user custom role assignments
DELETE FROM public.user_custom_roles;

-- Delete role permissions
DELETE FROM public.role_permissions;

-- Delete user roles
DELETE FROM public.user_roles;

-- Delete profiles
DELETE FROM public.profiles;

-- Delete custom roles
DELETE FROM public.custom_roles;

-- Delete permissions
DELETE FROM public.permissions;

-- Delete families
DELETE FROM public.families;

-- Delete device profiles
DELETE FROM public.device_profiles;

-- Delete organization settings
DELETE FROM public.organization_settings;

-- Delete users from auth schema (this will cascade to related tables)
-- Note: This requires elevated privileges, may need to be done manually in Supabase dashboard
-- DELETE FROM auth.users;

-- Reset sequences if needed
-- ALTER SEQUENCE IF EXISTS <sequence_name> RESTART WITH 1;
