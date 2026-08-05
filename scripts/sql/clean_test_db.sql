-- 1. Remove all operational test traffic data
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.message_read_receipts CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.report_seals CASCADE;
TRUNCATE TABLE public.devices CASCADE;
TRUNCATE TABLE public.children CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.staff_shifts CASCADE;
TRUNCATE TABLE public.password_reset_tokens CASCADE;

-- 2. Remove all user accounts except wisdom_borntobegreat@yahoo.com
-- Delete roles for all other users
DELETE FROM public.user_roles 
WHERE user_id NOT IN (
    SELECT id FROM public.profiles WHERE LOWER(email) = 'wisdom_borntobegreat@yahoo.com'
);

-- Delete profiles for all other users
DELETE FROM public.profiles 
WHERE LOWER(email) != 'wisdom_borntobegreat@yahoo.com';

-- 3. Verify that your profile remains and has super admin rights
INSERT INTO public.user_roles (user_id, role, is_super_admin)
SELECT id, 'super_admin', true 
FROM public.profiles 
WHERE LOWER(email) = 'wisdom_borntobegreat@yahoo.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', is_super_admin = true;

UPDATE public.profiles 
SET role = 'super_admin' 
WHERE LOWER(email) = 'wisdom_borntobegreat@yahoo.com';
