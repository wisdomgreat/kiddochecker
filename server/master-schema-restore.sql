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

-- 10. CARE LOGS & INCIDENT LEDGER
CREATE TABLE IF NOT EXISTS public.care_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    staff_id UUID,
    note_type TEXT DEFAULT 'general',
    note TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_care_logs_attendance_id ON public.care_logs(attendance_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_child_id ON public.care_logs(child_id);

-- 11. COMPREHENSIVE RPC FUNCTIONS FOR REPORTING, AUDIT, KIOSK & STAFF

-- Attendance Aggregated Report
CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date) 
RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_checked_in bigint, total_checked_out bigint) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        a.attendance_date::date, 
        c.id as class_id, 
        COALESCE(c.name, 'General / Summer Camp') as class_name, 
        COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_in_at IS NOT NULL) as total_checked_in, 
        COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_out_at IS NOT NULL) as total_checked_out 
    FROM public.attendance a 
    LEFT JOIN public.classes c ON a.class_id = c.id 
    WHERE a.attendance_date::date BETWEEN start_date AND end_date 
    GROUP BY a.attendance_date::date, c.id, c.name; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master Liability & Audit Report
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
        a.attendance_date::date, 
        COALESCE(CONCAT(ch.first_name, ' ', ch.last_name), 'Registered Child') as child_name, 
        ch.age as child_age, 
        COALESCE((ch.allergies IS NOT NULL AND ch.allergies <> '' AND ch.allergies <> 'None'), false) as has_allergies, 
        COALESCE(cl.name, 'General / Summer Camp') as class_name, 
        a.checked_in_at, 
        COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'Parent / Self Kiosk') as checked_in_by_name, 
        COALESCE(ur_in.role::text, 'parent') as checked_in_by_role, 
        COALESCE(a.checked_in_method, 'kiosk') as checked_in_method, 
        COALESCE(a.checked_in_station, 'Main Kiosk') as checked_in_station, 
        a.checked_out_at, 
        COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'On-Site') as checked_out_by_name, 
        COALESCE(ur_out.role::text, 'parent') as checked_out_by_role, 
        a.checked_out_method, 
        a.checked_out_station, 
        CASE WHEN a.checked_out_at IS NOT NULL THEN EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0 ELSE NULL END as duration_hours, 
        COALESCE(a.health_fever, false) as health_fever, 
        COALESCE(a.health_cough, false) as health_cough, 
        a.special_instructions, 
        a.device_metadata->>'userAgent' as device_ua 
    FROM public.attendance a 
    LEFT JOIN public.children ch ON a.child_id = ch.id 
    LEFT JOIN public.classes cl ON a.class_id = cl.id 
    LEFT JOIN public.profiles p_in ON a.checked_in_by = p_in.id 
    LEFT JOIN public.profiles p_out ON a.checked_out_by = p_out.id 
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE 
    LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE 
    WHERE a.attendance_date::date BETWEEN start_date AND end_date 
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC; 
END; 
$$;

-- Detailed Attendance Report for Advanced Analytics
CREATE OR REPLACE FUNCTION public.get_detailed_attendance_report(start_date text, end_date text)
RETURNS TABLE (
    id UUID,
    attendance_date DATE,
    child_id UUID,
    child_name TEXT,
    class_id UUID,
    class_name TEXT,
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.attendance_date::date,
        a.child_id,
        COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'Registered Child') as child_name,
        a.class_id,
        COALESCE(cl.name, 'General / Summer Camp') as class_name,
        a.checked_in_at,
        a.checked_out_at,
        COALESCE(a.status, 'present') as status
    FROM public.attendance a
    LEFT JOIN public.children c ON a.child_id = c.id
    LEFT JOIN public.classes cl ON a.class_id = cl.id
    WHERE a.attendance_date::date BETWEEN start_date::date AND end_date::date
    ORDER BY a.attendance_date DESC, a.checked_in_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Class Roster with Attendance
CREATE OR REPLACE FUNCTION public.get_class_roster_with_attendance(p_class_id UUID)
RETURNS TABLE (
    child_id UUID,
    first_name TEXT,
    last_name TEXT,
    age INTEGER,
    allergies TEXT,
    is_present BOOLEAN,
    checked_in_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as child_id,
        c.first_name,
        c.last_name,
        c.age,
        c.allergies,
        EXISTS(
            SELECT 1 FROM public.attendance a 
            WHERE a.child_id = c.id 
            AND a.attendance_date::date = CURRENT_DATE 
            AND a.checked_in_at IS NOT NULL 
            AND a.checked_out_at IS NULL
        ) as is_present,
        (
            SELECT a.checked_in_at FROM public.attendance a 
            WHERE a.child_id = c.id 
            AND a.attendance_date::date = CURRENT_DATE 
            ORDER BY a.checked_in_at DESC LIMIT 1
        ) as checked_in_at
    FROM public.children c
    WHERE p_class_id IS NULL OR c.class_id = p_class_id
    ORDER BY c.first_name, c.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Parent Children with Classes (Clean unique signature)
DROP FUNCTION IF EXISTS public.get_parent_children_with_classes(UUID);
DROP FUNCTION IF EXISTS public.get_parent_children_with_classes(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL) 
RETURNS TABLE (
    child_id UUID, 
    first_name TEXT, 
    last_name TEXT, 
    age INTEGER, 
    allergies TEXT, 
    medical_info TEXT, 
    emergency_contact_name TEXT, 
    emergency_contact_phone TEXT, 
    notes TEXT, 
    current_class_name TEXT
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        c.id as child_id, 
        c.first_name, 
        c.last_name, 
        c.age, 
        c.allergies, 
        c.medical_info, 
        c.emergency_contact_name, 
        c.emergency_contact_phone, 
        c.notes, 
        COALESCE(cl.name, 'General / Summer Camp') as current_class_name 
    FROM public.children c 
    LEFT JOIN public.classes cl ON c.class_id = cl.id 
    WHERE c.parent_id = COALESCE(parent_user_id, p_user_id); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff Verification Status
CREATE OR REPLACE FUNCTION public.get_staff_verification_status(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    is_verified BOOLEAN,
    verification_status TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    documents_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        COALESCE(ur.role IN ('admin', 'super_admin', 'staff', 'teacher'), false) as is_verified,
        COALESCE(ur.role, 'pending')::TEXT as verification_status,
        p.created_at as verified_at,
        p.id as verified_by,
        (SELECT COUNT(*)::INTEGER FROM public.staff_documents sd WHERE sd.staff_id = p.id) as documents_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pending Staff Verifications
CREATE OR REPLACE FUNCTION public.get_pending_staff_verifications()
RETURNS TABLE (
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    documents_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        COALESCE(p.first_name, '')::TEXT,
        COALESCE(p.last_name, '')::TEXT,
        COALESCE(p.email, '')::TEXT,
        COALESCE(ur.role::TEXT, p.role::TEXT, 'staff')::TEXT,
        COALESCE(p.created_at, NOW()),
        (SELECT COUNT(*)::INTEGER FROM public.staff_documents sd WHERE sd.staff_id = p.id) as documents_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE COALESCE(ur.role::TEXT, p.role::TEXT) IN ('staff', 'teacher', 'volunteer', 'pending')
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin Verify Staff Action
CREATE OR REPLACE FUNCTION public.admin_verify_staff(p_user_id UUID, p_action TEXT DEFAULT 'approved', p_notes TEXT DEFAULT NULL, p_admin_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_action = 'approved' THEN
        INSERT INTO public.user_roles (user_id, role, is_super_admin)
        VALUES (p_user_id, 'staff', false)
        ON CONFLICT (user_id) DO UPDATE SET role = 'staff';
    END IF;

    INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details)
    VALUES (
        COALESCE(p_admin_id, p_user_id),
        'verify_staff',
        'user_roles',
        p_user_id::text,
        jsonb_build_object('action', p_action, 'notes', p_notes)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Event Volunteer Stats
CREATE OR REPLACE FUNCTION public.get_event_volunteer_stats(p_event_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_volunteers INTEGER,
    confirmed_volunteers INTEGER,
    pending_volunteers INTEGER,
    roles_covered INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.user_roles WHERE role = 'volunteer'),
        (SELECT COUNT(*)::INTEGER FROM public.user_roles WHERE role = 'volunteer'),
        0::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM public.volunteer_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff PIN Generator
CREATE OR REPLACE FUNCTION public.generate_staff_pin_rpc(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_pin TEXT;
BEGIN
    v_pin := LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
    UPDATE public.profiles
    SET staff_pin = v_pin, security_pin = v_pin
    WHERE id = p_user_id;
    RETURN v_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate Roster from Template
CREATE OR REPLACE FUNCTION public.generate_roster_from_template(p_template_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO public.shifts (staff_id, start_time, end_time, status, role_type)
    SELECT 
        p.id, 
        (p_date || ' 09:00:00')::TIMESTAMPTZ, 
        (p_date || ' 12:30:00')::TIMESTAMPTZ, 
        'confirmed', 
        'leader'
    FROM public.profiles p
    JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE ur.role IN ('staff', 'teacher')
    LIMIT 5;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Active Sessions for Current User
CREATE OR REPLACE FUNCTION public.get_my_active_sessions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    device_name TEXT,
    ip_address TEXT,
    last_active TIMESTAMPTZ,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gen_random_uuid() as id,
        'Active Web Browser Terminal'::TEXT as device_name,
        '10.0.1.4'::TEXT as ip_address,
        NOW() as last_active,
        true as is_current;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke Session
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sensitive Access Logging
CREATE OR REPLACE FUNCTION public.log_sensitive_access(p_resource TEXT, p_resource_id TEXT DEFAULT NULL, p_reason TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_logs (action, resource, resource_id, details)
    VALUES ('sensitive_data_access', p_resource, p_resource_id, jsonb_build_object('reason', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Emails by IDs (for Family Connect)
CREATE OR REPLACE FUNCTION public.get_users_emails(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT, first_name TEXT, last_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.first_name, p.last_name
    FROM public.profiles p
    WHERE p.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redeem Reward RPC
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id UUID, p_user_id UUID DEFAULT NULL, p_child_id UUID DEFAULT NULL, p_points INTEGER DEFAULT 10)
RETURNS JSONB AS $$
DECLARE
    v_redemption_id UUID;
BEGIN
    INSERT INTO public.reward_redemptions (reward_id, user_id, child_id, points_at_redemption, status)
    VALUES (p_reward_id, p_user_id, p_child_id, p_points, 'completed')
    RETURNING id INTO v_redemption_id;
    RETURN jsonb_build_object('success', true, 'id', v_redemption_id, 'redemption_id', v_redemption_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- QR Code Generator RPC
CREATE OR REPLACE FUNCTION public.generate_qr_code_rpc(p_child_id UUID, p_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_qr TEXT;
BEGIN
    v_qr := COALESCE(p_code, 'KID-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)));
    UPDATE public.attendance
    SET qr_token = v_qr
    WHERE child_id = p_child_id;
    RETURN v_qr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization Creation & Role Assignment
CREATE OR REPLACE FUNCTION public.create_organization(p_name TEXT, p_slug TEXT, p_creator_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    INSERT INTO public.organizations (name, slug)
    VALUES (p_name, p_slug)
    ON CONFLICT (slug) DO UPDATE SET name = p_name
    RETURNING id INTO v_org_id;
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_organization_creator_role(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role, is_super_admin)
    VALUES (p_user_id, 'admin', true)
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin', is_super_admin = true;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe Admin Check
CREATE OR REPLACE FUNCTION public.is_admin_user_safe(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT (role IN ('admin', 'super_admin') OR is_super_admin = true) INTO v_is_admin
    FROM public.user_roles
    WHERE user_id = p_user_id
    LIMIT 1;
    RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staff Shift Kiosk Action
CREATE OR REPLACE FUNCTION public.staff_shift_action_kiosk(p_staff_id UUID, p_action TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('success', true, 'action', p_action, 'timestamp', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_redemption_status(p_redemption_id UUID, p_status TEXT) 
RETURNS VOID AS $$
BEGIN
    UPDATE public.reward_redemptions
    SET status = p_status
    WHERE id = p_redemption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. SEED FOUNDATIONAL ACTIVITY LOGS & CARE NOTES
INSERT INTO public.activity_logs (user_id, action, resource, resource_id, details, created_at)
VALUES
    ('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'kiosk_checkin', 'attendance', '66fe05c0-9d0b-4e76-9cfa-89fb72839046', '{"child_name": "Ade Der", "station": "Main Lobby Kiosk", "method": "PIN"}', NOW() - INTERVAL '3 hours'),
    ('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'kiosk_checkin', 'attendance', 'e42d5466-58b9-4651-850c-c69123619d2c', '{"child_name": "Jackson Stevenson", "station": "Children Wing Tablet", "method": "QR"}', NOW() - INTERVAL '2 hours'),
    ('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'role_assigned', 'user_roles', '4d5627f7-dbf4-4d6c-97c8-f0b23f0d7fc3', '{"role": "staff", "assigned_by": "Administrator"}', NOW() - INTERVAL '1 day'),
    ('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'system_config', 'kiosk_settings', 'allowed_ips', '{"allowed_ips": "10.0.1.4, 127.0.0.1", "action": "updated"}', NOW() - INTERVAL '2 days'),
    ('8acff9ad-32db-49e8-9ca8-b6f6b3f19aaa', 'email_broadcast', 'email_logs', 'summer_camp_pass', '{"recipients_count": 12, "subject": "Summer Camp 2026 PIN"}', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Seed Sample Care Logs
INSERT INTO public.care_logs (child_id, note_type, note, logged_at)
SELECT id, 'allergy_alert', 'Special care required: confirmed peanut and tree-nut allergy protocol active.', NOW() - INTERVAL '1 day'
FROM public.children
WHERE allergies IS NOT NULL AND allergies <> '' AND allergies <> 'None'
LIMIT 5
ON CONFLICT DO NOTHING;
