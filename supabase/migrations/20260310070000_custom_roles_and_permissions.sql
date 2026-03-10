-- =====================================================================
-- CUSTOM ROLES AND PERSMISSIONS SYSTEM
-- =====================================================================

-- ── 1. Create or Repair permissions table ──
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist and relax old constraints for the new system
DO $$ 
BEGIN 
    -- Add category column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.permissions ADD COLUMN category TEXT;
    END IF;

    -- Make 'resource' nullable if it exists (legacy column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'resource'
    ) THEN
        ALTER TABLE public.permissions ALTER COLUMN resource DROP NOT NULL;
    END IF;

    -- Make 'action' nullable if it exists (legacy column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'action'
    ) THEN
        ALTER TABLE public.permissions ALTER COLUMN action DROP NOT NULL;
    END IF;

    -- Ensure UNIQUE constraint on name exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_index i 
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = 'public.permissions'::regclass 
        AND i.indisunique 
        AND a.attname = 'name'
    ) THEN
        -- Clean up duplicates before adding constraint
        DELETE FROM public.permissions p1
        USING public.permissions p2
        WHERE p1.id > p2.id AND p1.name = p2.name;

        ALTER TABLE public.permissions ADD CONSTRAINT permissions_name_unique UNIQUE (name);
    END IF;
END $$;

-- Seed/Update permissions
-- We use unique names to identify permissions in the new system
INSERT INTO public.permissions (name, description, category) VALUES
('view_all_children', 'View all children records in the system', 'children'),
('manage_all_children', 'Create, edit, and delete any child record', 'children'),
('view_assigned_children', 'View children only in assigned classes', 'children'),
('manage_classes', 'Create, edit, and delete classrooms', 'management'),
('assign_staff_to_classes', 'Assign teachers and assistants to classes', 'management'),
('view_all_attendance', 'View attendance for all kids', 'attendance'),
('view_assigned_attendance', 'View attendance for assigned classes', 'attendance'),
('manage_qr_codes', 'Generate and print QR labels', 'kiosk'),
('manage_kiosk_settings', 'Configure kiosk behavior and timeouts', 'kiosk'),
('manage_users', 'Create and manage user accounts and roles', 'management'),
('view_audit_logs', 'Access system audit trails', 'security')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Assign a category to any legacy permissions that don't have one
UPDATE public.permissions SET category = 'legacy' WHERE category IS NULL;

-- ── 2. Create custom_roles table ──
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    base_role TEXT, -- e.g., 'staff', 'teacher'
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- ── 3. Create role_permissions join table ──
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ── 4. Link user_roles to custom_roles ──
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'user_roles'
          AND column_name  = 'custom_role_id'
    ) THEN
        ALTER TABLE public.user_roles
            ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ── 5. Enable RLS ──
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "SuperAdmins can manage permissions" ON public.permissions;
CREATE POLICY "SuperAdmins can manage permissions" ON public.permissions FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SuperAdmins can manage custom roles" ON public.custom_roles;
CREATE POLICY "SuperAdmins can manage custom roles" ON public.custom_roles FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view custom roles" ON public.custom_roles;
CREATE POLICY "Everyone can view custom roles" ON public.custom_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SuperAdmins can manage role permissions" ON public.role_permissions;
CREATE POLICY "SuperAdmins can manage role permissions" ON public.role_permissions FOR ALL USING (public.is_admin_secure());

DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;
CREATE POLICY "Everyone can view role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- ── 6. Helper function to check permissions ──
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- SuperAdmins bypass all permission checks
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND is_super_admin = true) THEN
        RETURN TRUE;
    END IF;

    -- Check if user's custom role has the permission
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.custom_role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.name = p_permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
