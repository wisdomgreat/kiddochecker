-- =============================================================
-- Migration: Enhanced Security Management
-- Description: Seeds system roles and enables name/description editing.
-- =============================================================

-- 1. Ensure is_system_role column exists (it should from 20260310070000)
-- But let's verify or add it just in case.
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'is_system_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN is_system_role BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_roles' AND column_name = 'base_role'
    ) THEN
        ALTER TABLE public.custom_roles ADD COLUMN base_role TEXT;
    END IF;

    -- 1.2 Ensure name is UNIQUE for ON CONFLICT
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.custom_roles'::regclass
        AND i.indisunique
        AND a.attname = 'name'
    ) THEN
        -- Clean up any duplicates just in case
        DELETE FROM public.custom_roles cr1
        USING public.custom_roles cr2
        WHERE cr1.id > cr2.id AND cr1.name = cr2.name;

        ALTER TABLE public.custom_roles ADD CONSTRAINT custom_roles_name_unique UNIQUE (name);
    END IF;
END $$;

-- 2. Seed System Roles into custom_roles
-- This allows adjusting permissions for built-in roles.
DO $$
BEGIN
    EXECUTE 'INSERT INTO public.custom_roles (name, description, base_role, is_system_role) VALUES
    (''System: Administrator'', ''Baseline permissions for organizational administrators.'', ''admin'', true),
    (''System: Staff'', ''Standard operational permissions for staff members.'', ''staff'', true),
    (''System: Teacher'', ''Standard educational and classroom management permissions.'', ''teacher'', true),
    (''System: Assistant Teacher'', ''Restricted classroom support permissions.'', ''teacher_assistant'', true),
    (''System: Volunteer'', ''Minimum viable permissions for event-based volunteers.'', ''volunteer'', true),
    (''System: Kiosk'', ''Fixed-terminal permissions for automated check-in hardware.'', ''kiosk'', true),
    (''System: Parent'', ''Personal data access and children management for families.'', ''parent'', true)
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        base_role = EXCLUDED.base_role,
        is_system_role = true';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error seeding system roles: %', SQLERRM;
END $$;

-- 3. Update permissions table to include categories for UI grouping
UPDATE public.permissions SET category = 'General' WHERE category IS NULL OR category = 'legacy';

-- 4. Assign default permissions to system roles if they don't have them
-- This ensures the system doesn't break when switching to custom-role based checks.
-- (We'll do this based on the existing standard permissions)

-- Admin gets almost everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Administrator'
ON CONFLICT DO NOTHING;

-- Staff gets operational perms
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Staff' AND p.category IN ('children', 'attendance', 'kiosk')
ON CONFLICT DO NOTHING;

-- Teacher gets classroom perms
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT cr.id, p.id 
FROM public.custom_roles cr, public.permissions p
WHERE cr.name = 'System: Teacher' AND p.name IN ('view_assigned_children', 'view_assigned_attendance', 'manage_classes')
ON CONFLICT DO NOTHING;
