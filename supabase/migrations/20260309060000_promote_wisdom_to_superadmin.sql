
-- Migration: Promote Wisdom to Super Admin
-- Date: 2026-03-09

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'wisdom.borntobegreat@yahoo.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Safely update user_roles
        INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
        VALUES (v_user_id, 'super_admin'::app_role, true, 'verified', NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            role = 'super_admin'::app_role,
            is_super_admin = true,
            verification_status = 'verified',
            verified_at = NOW();
            
        RAISE NOTICE 'User wisdom.borntobegreat@yahoo.com promoted to super_admin';
    END IF;
END $$;
