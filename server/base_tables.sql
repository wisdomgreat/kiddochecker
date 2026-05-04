-- Generated Smart Base Schema

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  resource TEXT,
  resource_id UUID,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  age_range TEXT,
  room TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  min_age INTEGER,
  max_age INTEGER
);

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  family_id TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_info TEXT,
  has_guardian_approval BOOLEAN,
  class_id UUID,
  photo_url TEXT,
  youth_pin TEXT,
  allow_self_check BOOLEAN,
  points_balance INTEGER
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID,
  class_id UUID,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  checked_in_by UUID,
  checked_out_by TEXT,
  attendance_date DATE,
  checked_in_method TEXT,
  checked_out_method TEXT,
  checked_in_station TEXT,
  checked_out_station TEXT,
  special_instructions TEXT,
  signature_data TEXT,
  health_screening_fever BOOLEAN,
  health_screening_cough BOOLEAN
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.child_medical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID,
  blood_type TEXT,
  allergies TEXT,
  medications TEXT,
  conditions TEXT,
  dietary_restrictions TEXT,
  emergency_notes TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  last_physical_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  address TEXT,
  qr_code_data TEXT,
  security_question TEXT,
  security_answer TEXT,
  security_answer_hash TEXT,
  security_pin TEXT,
  staff_pin TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  has_active_background_check BOOLEAN,
  bio TEXT,
  specialties TEXT,
  preferred_class_id TEXT,
  max_hours_per_week INTEGER,
  department TEXT,
  gender TEXT,
  date_of_birth TEXT,
  marital_status TEXT,
  secondary_phone TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  website TEXT,
  social_links TEXT,
  email TEXT,
  supervisor_id TEXT
);

CREATE TABLE IF NOT EXISTS public.church_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID,
  child_id TEXT,
  membership_type TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ,
  baptism_date TEXT,
  confirmation_date TEXT,
  wedding_date TEXT,
  pastoral_notes TEXT,
  spiritual_milestones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  journey_stage TEXT
);

CREATE TABLE IF NOT EXISTS public.communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  enable_sms_pickups BOOLEAN,
  enable_email_pickups BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT now(),
  resend_api_key TEXT,
  resend_domain TEXT
);

CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_system_role BOOLEAN,
  base_role TEXT
);

CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  resource_type TEXT,
  resource_id UUID,
  accessed_at TIMESTAMPTZ,
  context TEXT
);

CREATE TABLE IF NOT EXISTS public.debug_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  role TEXT,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrolled_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT,
  enrollment_code TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  location TEXT,
  enrolled_by UUID,
  organization_id TEXT,
  last_seen TIMESTAMPTZ,
  last_ip TEXT,
  device_info TEXT,
  enrolled_at TIMESTAMPTZ,
  revoked_at TEXT,
  revoked_by TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  hardware_id TEXT,
  os_info TEXT,
  browser_info TEXT,
  device_fingerprint TEXT,
  failure_count INTEGER,
  locked_until TEXT,
  security_status TEXT,
  serial_number TEXT
);

CREATE TABLE IF NOT EXISTS public.device_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID,
  action TEXT,
  performed_by UUID,
  ip_address TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.device_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID,
  name TEXT,
  type TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT,
  display_name TEXT,
  description TEXT,
  required_for_roles TEXT,
  is_mandatory BOOLEAN,
  has_expiry BOOLEAN,
  expiry_months INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID,
  amount NUMERIC,
  currency TEXT,
  donation_date TIMESTAMPTZ,
  payment_method TEXT,
  category TEXT,
  is_anonymous BOOLEAN,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  subject TEXT,
  body_html TEXT,
  description TEXT,
  placeholders TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.engagement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  category TEXT,
  due_date TEXT,
  assigned_to UUID,
  member_id UUID,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TEXT,
  location TEXT,
  organizer TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  resource TEXT,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.security_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID,
  journey_type TEXT,
  current_step INTEGER,
  status TEXT,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kiosk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.medical_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID,
  actor_id UUID,
  action TEXT,
  old_data TEXT,
  new_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID,
  recipient_id TEXT,
  subject TEXT,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  recipient_role TEXT,
  is_broadcast BOOLEAN,
  sent_via_sms BOOLEAN,
  sent_via_email BOOLEAN
);

CREATE TABLE IF NOT EXISTS public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  head_staff_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ministry_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID,
  name TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  location TEXT,
  leader_profile_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ministry_member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID,
  group_id UUID,
  role TEXT,
  assigned_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  font_family TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  require_checkout_signature BOOLEAN,
  google_maps_api_key TEXT,
  show_center_finder BOOLEAN,
  max_upload_size_kb INTEGER,
  upload_limit_type TEXT,
  blocked_extensions TEXT,
  show_wellness_check BOOLEAN,
  timezone TEXT
);

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID,
  qr_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TEXT,
  is_active BOOLEAN
);

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  points INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID,
  permission_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduling_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.volunteer_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID,
  name TEXT,
  description TEXT,
  skills_required TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduling_requirement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
  day_of_week INTEGER,
  start_time TEXT,
  end_time TEXT,
  role_type TEXT,
  class_id TEXT,
  required_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  required_group_id TEXT,
  ministry_id TEXT,
  volunteer_role_id TEXT
);

CREATE TABLE IF NOT EXISTS public.security_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  user_id UUID,
  action TEXT,
  status TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID,
  class_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT,
  role_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  actual_start_time TEXT,
  actual_end_time TEXT,
  kiosk_id TEXT,
  event_id TEXT,
  volunteer_role_id TEXT,
  ministry_id TEXT
);

CREATE TABLE IF NOT EXISTS public.staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  document_type TEXT,
  document_name TEXT,
  file_path TEXT,
  file_size INTEGER,
  description TEXT,
  status TEXT,
  uploaded_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_group_members (
  group_id UUID,
  profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_group_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID,
  attribute_type TEXT,
  attribute_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  class_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_super_admin BOOLEAN,
  is_volunteer BOOLEAN,
  verification_status TEXT,
  verified_at TEXT,
  verified_by TEXT,
  verification_notes TEXT,
  custom_role_id TEXT
);

CREATE TABLE IF NOT EXISTS public.visitor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID,
  interaction_type TEXT,
  content TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

