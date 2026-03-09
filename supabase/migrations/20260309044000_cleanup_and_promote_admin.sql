
-- Migration: cleanup user_roles and promote admin
-- Date: 2026-03-09

-- 1. Ensure all values exist in app_role enum
DO $$
BEGIN
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'teacher_assistant';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'volunteer';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'kiosk';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. Remove duplicates from user_roles
WITH dedupped AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY 
             CASE role::TEXT
               WHEN 'super_admin' THEN 1
               WHEN 'admin' THEN 2
               WHEN 'teacher' THEN 3
               WHEN 'teacher_assistant' THEN 4
               WHEN 'staff' THEN 5
               WHEN 'volunteer' THEN 6
               WHEN 'parent' THEN 7
               ELSE 10
             END ASC, created_at DESC) as rn
    FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (SELECT id FROM dedupped WHERE rn > 1);

-- 3. Add unique constraint to prevent future duplicates
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 4. Explicitly promote the users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Promote wisdom_borntobegreat@yahoo.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom_borntobegreat@yahoo.com';
    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_roles 
        SET role = 'super_admin'::public.app_role, 
            is_super_admin = true, 
            verification_status = 'verified', 
            verified_at = NOW()
        WHERE user_id = v_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
            VALUES (v_user_id, 'super_admin'::public.app_role, true, 'verified', NOW());
        END IF;
    END IF;

    -- Promote wisdom.salami@tdwas.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom.salami@tdwas.com';
    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_roles 
        SET role = 'super_admin'::public.app_role, 
            is_super_admin = true, 
            verification_status = 'verified', 
            verified_at = NOW()
        WHERE user_id = v_user_id;
    END IF;
END $$;
