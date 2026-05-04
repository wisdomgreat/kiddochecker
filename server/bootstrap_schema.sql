-- Core Schema Bootstrap for KiddoChecker Azure
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS public;

-- Profiles Table (The Master User List)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    role TEXT DEFAULT 'parent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    address TEXT,
    qr_code_data TEXT,
    security_question TEXT,
    security_answer TEXT,
    security_answer_hash TEXT,
    security_pin TEXT,
    staff_pin TEXT,
    avatar_url TEXT,
    photo_url TEXT,
    has_active_background_check BOOLEAN DEFAULT FALSE,
    bio TEXT,
    specialties TEXT[],
    preferred_class_id UUID,
    max_hours_per_week INTEGER DEFAULT 40,
    department TEXT,
    gender TEXT,
    date_of_birth DATE,
    marital_status TEXT,
    secondary_phone TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    occupation TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}',
    supervisor_id UUID,
    azure_oid TEXT -- Added for the Identity Bridge
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_azure_oid ON public.profiles(azure_oid);

-- Basic Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
