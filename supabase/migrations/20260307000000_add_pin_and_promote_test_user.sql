
-- 1. Add security_pin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS security_pin TEXT;

-- 2. Promote the test user to super_admin so we can test admin flows
-- We use the email to find the user in auth.users
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testparent2@example.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Upsert role into user_roles safely without needing a unique constraint on user_id
        IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
            UPDATE public.user_roles 
            SET role = 'super_admin'::app_role, 
                is_super_admin = true, 
                verification_status = 'verified', 
                verified_at = NOW()
            WHERE user_id = v_user_id;
        ELSE
            INSERT INTO public.user_roles (user_id, role, is_super_admin, verification_status, verified_at)
            VALUES (v_user_id, 'super_admin'::app_role, true, 'verified', NOW());
        END IF;
            
        RAISE NOTICE 'User testparent2@example.com promoted to super_admin';
    END IF;
END $$;
