-- Master Schema Restoration for KiddoChecker on Azure PostgreSQL

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    base_role TEXT DEFAULT 'staff',
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id TEXT NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Seed System Roles
INSERT INTO public.custom_roles (id, name, description, base_role, is_system_role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access and tenant management', 'super_admin', true),
    ('00000000-0000-0000-0000-000000000002', 'Administrator', 'Full operational control and reporting', 'admin', true),
    ('00000000-0000-0000-0000-000000000003', 'Lead Teacher', 'Class management and roster controls', 'teacher', true),
    ('00000000-0000-0000-0000-000000000004', 'Assistant Teacher', 'Class check-in and attendance assistance', 'teacher_assistant', true),
    ('00000000-0000-0000-0000-000000000005', 'Ministry Staff', 'General staff operations and supervision', 'staff', true),
    ('00000000-0000-0000-0000-000000000006', 'Volunteer', 'Support volunteer for check-in and events', 'volunteer', true),
    ('00000000-0000-0000-0000-000000000007', 'Parent / Guardian', 'Parent access to family registration', 'parent', true),
    ('00000000-0000-0000-0000-000000000008', 'Kiosk Station', 'Terminal mode for child check-in & badges', 'kiosk', true)
ON CONFLICT (name) DO UPDATE SET is_system_role = true;

-- Seed Granular Permissions
INSERT INTO public.permissions (name, description, category)
VALUES
    ('manage_users', 'Create, edit, and delete user profiles and roles', 'users'),
    ('manage_classes', 'Create and modify classes and age ranges', 'classes'),
    ('view_all_children', 'View all child records and medical alerts', 'children'),
    ('manage_qr_codes', 'Generate, assign, and print QR codes and badges', 'kiosk'),
    ('view_audit_logs', 'Access system security and liability audit logs', 'security'),
    ('manage_system', 'Configure system settings, email templates, and integrations', 'system'),
    ('manage_kiosk', 'Control kiosk hardware, printers, and stations', 'kiosk'),
    ('church_view', 'View congregation members and ministry departments', 'church'),
    ('church_manage_members', 'Enroll and manage church congregation members', 'church'),
    ('church_manage_ministries', 'Manage ministry groups and leaders', 'church'),
    ('view_all_attendance', 'Access full real-time attendance rosters', 'attendance'),
    ('edit_attendance', 'Manually check-in or checkout children', 'attendance')
ON CONFLICT (name) DO NOTHING;

-- 3. ENROLLED DEVICES & KIOSKS
CREATE TABLE IF NOT EXISTS public.enrolled_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'kiosk',
    location TEXT,
    enrollment_code TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    security_status TEXT DEFAULT 'secure',
    enrolled_by UUID,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    last_ip TEXT,
    os_info TEXT,
    browser_info TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    notes TEXT,
    failure_count INTEGER DEFAULT 0,
    serial_number TEXT,
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'kiosk',
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    is_authorized BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.device_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Kiosk Terminals
INSERT INTO public.enrolled_devices (name, type, location, enrollment_code, status, security_status, serial_number, notes)
VALUES
    ('Main Entrance Tablet A', 'kiosk', 'Sanctuary Foyer', 'KIO-8821', 'active', 'secure', 'TB-2026-001', 'Primary check-in station with Brother QL-820NWB Printer'),
    ('Children Hallway Station B', 'kiosk', 'Children Ministry Wing', 'KIO-8822', 'active', 'secure', 'TB-2026-002', 'Express kiosk for preschool & primary classes'),
    ('Director iPad Pro', 'tablet', 'Camp Office', 'TAB-4401', 'active', 'secure', 'AP-2026-900', 'Mobile roster & emergency contact terminal')
ON CONFLICT DO NOTHING;

INSERT INTO public.devices (device_id, name, type, location, is_active, is_authorized)
VALUES
    ('station-main-foyer', 'Main Foyer Kiosk', 'kiosk', 'Main Lobby', true, true),
    ('station-kids-hall', 'Kids Hallway Kiosk', 'kiosk', 'Children Wing', true, true)
ON CONFLICT (device_id) DO NOTHING;

-- 4. ATTENDANCE REWARDS SYSTEM
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    user_id UUID,
    child_id UUID,
    points_at_redemption INTEGER NOT NULL DEFAULT 10,
    status TEXT DEFAULT 'completed',
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Attendance Prizes
INSERT INTO public.rewards (name, description, points)
VALUES
    ('⭐ Sticker & Activity Pack', 'Fun Bible-themed sticker set and coloring book', 5),
    ('🍦 Ice Cream / Treat Pass', 'Redeemable at Sunday Camp Snack Bar', 10),
    ('🎁 Toy Treasure Chest Pick', 'Choose any prize from the Kids Ministry Treasure Chest', 20),
    ('📖 Kids Illustrated Bible / Journal', 'Special commemorative kids devotional journal', 35),
    ('👕 Camp 2026 Official T-Shirt', 'Green Valley Alliance Summer Camp Tee', 50)
ON CONFLICT DO NOTHING;

-- 5. SHIFTS & SCHEDULING
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID,
    event_id UUID,
    class_id UUID,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'confirmed',
    role_type TEXT DEFAULT 'leader',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role_type TEXT DEFAULT 'volunteer',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.volunteer_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Shift Templates
INSERT INTO public.shift_templates (name, role_type, start_time, end_time)
VALUES
    ('Morning Check-In Greeter', 'volunteer', '08:30', '10:00'),
    ('Lead Teacher (Morning Session)', 'leader', '09:00', '12:30'),
    ('Assistant Teacher (Morning Session)', 'assistant', '09:00', '12:30'),
    ('Afternoon Activities Leader', 'leader', '12:30', '16:30'),
    ('Dismissal & Security Lead', 'volunteer', '16:00', '17:30')
ON CONFLICT DO NOTHING;

INSERT INTO public.volunteer_roles (name, description, department)
VALUES
    ('Check-In Host', 'Welcomes parents and guides kiosk badge check-in', 'Hospitality'),
    ('Classroom Helper', 'Assists teachers with crafts, games, and snacks', 'Children'),
    ('First Aid & Safety Officer', 'Oversees medical response and allergy protocols', 'Safety')
ON CONFLICT DO NOTHING;

-- 6. MINISTRIES & CONGREGATION CRM
CREATE TABLE IF NOT EXISTS public.ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_staff_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ministry_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meeting_day TEXT,
    meeting_time TEXT,
    location TEXT,
    leader_profile_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.church_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE,
    membership_type TEXT DEFAULT 'registered',
    status TEXT DEFAULT 'active',
    journey_stage TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visitor_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID,
    interaction_type TEXT DEFAULT 'first_visit',
    notes TEXT,
    followup_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Core Ministries
INSERT INTO public.ministries (id, name, description)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Children Ministry', 'Sunday School, Summer Day Camp, and Nursery'),
    ('10000000-0000-0000-0000-000000000002', 'Youth & Teens Ministry', 'Junior High and High School fellowship and mentorship'),
    ('10000000-0000-0000-0000-000000000003', 'Welcome & Hospitality', 'Greeters, Ushers, and Guest Connection Team'),
    ('10000000-0000-0000-0000-000000000004', 'Worship & Media', 'Music ministry, sound, visuals, and livestreaming'),
    ('10000000-0000-0000-0000-000000000005', 'Community Care & Prayer', 'Pastoral care, family support, and prayer ministry')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Link all parents in profiles table into church_memberships
INSERT INTO public.church_memberships (profile_id, membership_type, status, journey_stage, joined_at)
SELECT id, 'registered', 'active', 'member', COALESCE(created_at, NOW())
FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

-- 7. AUDIT LOGS & ACTIVITY
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CLASSROOM SETUP
INSERT INTO public.classes (name, description, age_range, capacity, room)
VALUES
    ('Nursery Room', 'Infants and toddlers safe play environment', '0-3 years', 15, 'Room 101'),
    ('Preschool & Kindergarten', 'Interactive Bible stories, crafts, and music', '4-5 years', 20, 'Room 102'),
    ('Primary Campers (6-8)', 'Camp activities, teamwork, and memory verses', '6-8 years', 25, 'Main Hall A'),
    ('Junior Campers (9-12)', 'Camp challenges, sports, and life lessons', '9-12 years', 30, 'Main Hall B'),
    ('Teens Fellowship (13+)', 'Youth leadership and mentorship discussions', '13-17 years', 25, 'Youth Lounge')
ON CONFLICT DO NOTHING;

-- 9. RPC FUNCTIONS FOR REPORTING & ANALYTICS

-- Clean up any ambiguous functions
DROP FUNCTION IF EXISTS public.get_church_stats();
DROP FUNCTION IF EXISTS public.get_church_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_church_stats(p_user_id UUID DEFAULT NULL) 
RETURNS JSONB AS $$ 
BEGIN 
    RETURN jsonb_build_object(
        'total_members', (SELECT COUNT(*) FROM public.profiles), 
        'visitor_count', (SELECT COUNT(*) FROM public.church_memberships WHERE membership_type = 'visitor'), 
        'regular_count', (SELECT COUNT(*) FROM public.church_memberships WHERE status = 'active'), 
        'integrations_perc', 94,
        'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE start_date >= CURRENT_DATE)
    ); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date) 
RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_checked_in bigint, total_checked_out bigint) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        a.attendance_date, 
        c.id as class_id, 
        COALESCE(c.name, 'General / Summer Camp') as class_name, 
        COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_in_at IS NOT NULL) as total_checked_in, 
        COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_out_at IS NOT NULL) as total_checked_out 
    FROM public.attendance a 
    LEFT JOIN public.classes c ON a.class_id = c.id 
    WHERE a.attendance_date BETWEEN start_date AND end_date 
    GROUP BY a.attendance_date, c.id, c.name; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date) 
RETURNS TABLE (
    attendance_id UUID, 
    attendance_date DATE, 
    child_name TEXT, 
    child_age INTEGER, 
    has_allergies BOOLEAN, 
    class_name TEXT, 
    checked_in_at TIMESTAMPTZ, 
    checked_in_by_name TEXT, 
    checked_in_by_role TEXT, 
    checked_in_method TEXT, 
    checked_in_station TEXT, 
    checked_out_at TIMESTAMPTZ, 
    checked_out_by_name TEXT, 
    checked_out_by_role TEXT, 
    checked_out_method TEXT, 
    checked_out_station TEXT, 
    duration_hours NUMERIC, 
    health_fever BOOLEAN, 
    health_cough BOOLEAN, 
    special_instructions TEXT, 
    device_ua TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        a.id as attendance_id, 
        a.attendance_date, 
        CONCAT(ch.first_name, ' ', ch.last_name) as child_name, 
        ch.age as child_age, 
        (ch.allergies IS NOT NULL AND ch.allergies <> '' AND ch.allergies <> 'None') as has_allergies, 
        COALESCE(cl.name, 'Summer Camp Roster') as class_name, 
        a.checked_in_at, 
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'Parent / Self Kiosk') as checked_in_by_name, 
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role, 
        a.checked_in_method, 
        a.checked_in_station, 
        a.checked_out_at, 
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'On-Site') as checked_out_by_name, 
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role, 
        a.checked_out_method, 
        a.checked_out_station, 
        CASE WHEN a.checked_out_at IS NOT NULL THEN EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0 ELSE NULL END as duration_hours, 
        a.health_fever, 
        a.health_cough, 
        a.special_instructions, 
        a.device_metadata->>'userAgent' as device_ua 
    FROM public.attendance a 
    JOIN public.children ch ON a.child_id = ch.id 
    LEFT JOIN public.classes cl ON a.class_id = cl.id 
    LEFT JOIN public.profiles p_in ON a.checked_in_by = p_in.id 
    LEFT JOIN public.profiles p_out ON a.checked_out_by = p_out.id 
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE 
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE 
    WHERE a.attendance_date BETWEEN start_date AND end_date 
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC; 
END; 
$$;

CREATE OR REPLACE FUNCTION public.update_redemption_status(p_redemption_id UUID, p_status TEXT) 
RETURNS VOID AS $$
BEGIN
    UPDATE public.reward_redemptions
    SET status = p_status
    WHERE id = p_redemption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
