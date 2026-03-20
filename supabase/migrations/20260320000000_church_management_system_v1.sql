-- ⛪ Church Management System (ChMS) - Initial Schema

-- Membership Types enum
DO $$ BEGIN
    CREATE TYPE membership_type AS ENUM ('registered', 'regular', 'visitor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Membership Status enum
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('active', 'inactive', 'deceased', 'transferred');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Church Memberships Table - A polymorphic-like link between profiles/children/members
CREATE TABLE IF NOT EXISTS church_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- For Parents, Staff, Admins
    child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- For Children
    membership_type membership_type DEFAULT 'regular',
    status membership_status DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT now(),
    baptism_date DATE,
    confirmation_date DATE,
    wedding_date DATE,
    pastoral_notes TEXT, -- Encouraged to be only seen by church staff
    spiritual_milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure a record points to either a profile OR a child, or it can be a standalone 'church-only' member record (if both null)
    -- Actually, if both null, it's just a general member who hasn't registered a parent/child account yet.
    CONSTRAINT profile_or_child_exclusive_ish CHECK (NOT (profile_id IS NOT NULL AND child_id IS NOT NULL))
);

-- Ministries Table
CREATE TABLE IF NOT EXISTS ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    head_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ministry Groups
CREATE TABLE IF NOT EXISTS ministry_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meeting_day TEXT, -- e.g. 'Sunday', 'Wednesday'
    meeting_time TIME,
    location TEXT,
    leader_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Member Group Memberships
CREATE TABLE IF NOT EXISTS ministry_member_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID REFERENCES church_memberships(id) ON DELETE CASCADE,
    group_id UUID REFERENCES ministry_groups(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Participant', -- 'Leader', 'Assistant', 'Participant'
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(membership_id, group_id)
);

-- RLS POLICIES
ALTER TABLE church_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_member_assignments ENABLE ROW LEVEL SECURITY;

-- Only admins and staff can see church-wide data
CREATE POLICY "Staff can view all church memberships"
ON church_memberships FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'teacher')
    )
);

CREATE POLICY "Users can view their own membership"
ON church_memberships FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Church admins and staff can manage memberships"
ON church_memberships FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
);

-- Repeat for Ministries/Groups
CREATE POLICY "Public authenticated can see ministries"
ON ministries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage ministries"
ON ministries FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Public authenticated can see groups"
ON ministry_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage groups"
ON ministry_groups FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

CREATE POLICY "Staff can see assignments"
ON ministry_member_assignments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff', 'teacher'))
);

CREATE POLICY "Staff can manage assignments"
ON ministry_member_assignments FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
);

-- RPC for Church Dashboard stats
CREATE OR REPLACE FUNCTION get_church_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_members', (SELECT count(*) FROM church_memberships),
        'registered_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'registered'),
        'regular_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'regular'),
        'visitor_count', (SELECT count(*) FROM church_memberships WHERE membership_type = 'visitor'),
        'total_ministries', (SELECT count(*) FROM ministries),
        'active_groups', (SELECT count(*) FROM ministry_groups)
    ) INTO result;
    RETURN result;
END;
$$;
