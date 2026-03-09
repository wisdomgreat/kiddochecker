
-- Migration: Enhanced Access Control and Kiosk Security
-- Date: 2026-03-08

-- 1. Add 'kiosk' to app_role enum
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'kiosk';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. Ensure Kiosk role exists in custom_roles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.custom_roles WHERE name = 'Kiosk') THEN
        INSERT INTO public.custom_roles (name, description)
        VALUES ('Kiosk', 'Dedicated role for check-in kiosk devices with limited access');
    END IF;
END $$;

-- 3. Add 'access_kiosk' permission
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.permissions WHERE name = 'access_kiosk') THEN
        INSERT INTO public.permissions (name, resource, action, description)
        VALUES ('access_kiosk', 'kiosk', 'access', 'Ability to access and operate the check-in kiosk');
    END IF;
END $$;

-- 4. Grant access_kiosk to relevant roles
DO $$
DECLARE
    v_perm_id uuid;
BEGIN
    SELECT id INTO v_perm_id FROM public.permissions WHERE name = 'access_kiosk';
    
    -- Admin, Staff, Teacher, Kiosk
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT id, v_perm_id FROM public.custom_roles WHERE name IN ('Admin', 'Staff', 'Teacher', 'Kiosk')
    ON CONFLICT DO NOTHING;
END $$;

-- 5. Helper function for kiosk access
CREATE OR REPLACE FUNCTION public.can_access_kiosk(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.check_user_permission(p_user_id, 'access_kiosk');
END;
$$;
