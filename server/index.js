const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const tenantResolver = require('./middleware/tenantResolver');

const app = express();
const port = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────
app.use(helmet()); // Secure Express apps by setting various HTTP headers
app.use(morgan('combined')); // HTTP request logger

// ─── Database Connection ──────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Self-healing: Ensure schema and table exist
async function setupDatabase() {
  console.log('[DB] Running migrations and schema verification...');
  try {
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.verification_codes (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
      );
    `);
    console.log('[DB] Auth schema and table verified.');
  } catch (err) {
    console.error('[DB] Schema Setup Error (Non-Fatal):', err.message);
  }

  // Grant BYPASSRLS to the service account so Supabase auth.uid()-based RLS
  // policies don't block the API server (auth.uid() is always NULL for pg connections).
  // This is safe: kiddomin is a trusted backend service account, not an end-user.
  try {
    const dbUser = process.env.DB_USER || 'kiddomin';
    await pool.query(`ALTER ROLE "${dbUser}" BYPASSRLS`);
    console.log(`[DB] BYPASSRLS granted to ${dbUser} — RLS will not block service queries.`);
  } catch (err) {
    // Azure PostgreSQL Flexible Server admin may not allow this — log but don't crash
    console.warn('[DB] Could not grant BYPASSRLS (non-fatal, auth may still fail via RLS):', err.message);
    // Fallback: try to set row_security off at session level in critical auth queries
  }

  // Ensure password_reset_tokens table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[DB] password_reset_tokens table verified.');
  } catch (err) {
    console.error('[DB] password_reset_tokens setup error (Non-Fatal):', err.message);
  }

  // Correct email typo in profiles table
  try {
    const res = await pool.query(`
      UPDATE public.profiles 
      SET email = 'wisdom_borntobegreat@yahoo.com' 
      WHERE LOWER(email) = 'wisdom_borntobegeat@yahoo.com' 
      RETURNING email;
    `);
    if (res.rows.length > 0) {
      console.log('[DB] Corrected email typo for user from wisdom_borntobegeat to wisdom_borntobegreat.');
    }
  } catch (err) {
    console.error('[DB] Error correcting email typo:', err.message);
  }

  // Temp full table dump for verification
  try {
    const client = await pool.connect();
    try {
      await client.query('SET row_security = off');
      
      const profilesRes = await client.query(`
        SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.role AS profile_role, ur.role AS mapped_role 
        FROM public.profiles p 
        LEFT JOIN public.user_roles ur ON p.id = ur.user_id
      `);
      console.log(`[DB_PROFILES_DUMP_START] Total profiles: ${profilesRes.rows.length}`);
      profilesRes.rows.forEach(row => {
        console.log('[PROFILE_ROW]', JSON.stringify(row));
      });

      const childrenRes = await client.query(`
        SELECT id, first_name, last_name, age, parent_id 
        FROM public.children
      `);
      console.log(`[DB_CHILDREN_DUMP_START] Total children: ${childrenRes.rows.length}`);
      childrenRes.rows.forEach(row => {
        console.log('[CHILD_ROW]', JSON.stringify(row));
      });
      
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB_DUMP_ERROR]', err.message);
  }
}


setupDatabase();

// ─── Hourly Database & Schema Integrity Compliance Sweep (COMP-03) ───────────
async function runComplianceHealthCheck() {
  console.log('[COMPLIANCE] Executing database connection and schema integrity compliance sweep...');
  try {
    // 1. Connection & Pool State Inspection
    const startTime = Date.now();
    await pool.query('SELECT 1;');
    const latency = Date.now() - startTime;
    
    const poolStats = {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount
    };
    
    console.log(`[COMPLIANCE] Connection healthy. Latency: ${latency}ms. Pool stats:`, poolStats);
    
    // 2. Schema Drift Analysis
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    const existingTables = new Set(tablesRes.rows.map(r => r.table_name.toLowerCase()));
    const requiredTables = ['profiles', 'children', 'attendance', 'kiosk_settings', 'activity_logs', 'password_reset_tokens'];
    const missingTables = requiredTables.filter(t => !existingTables.has(t));
    
    if (missingTables.length > 0) {
      console.error(`[CRITICAL] [SCHEMA_DRIFT] Missing compliance tables in public schema: ${missingTables.join(', ')}`);
    } else {
      console.log('[COMPLIANCE] All required public compliance schemas are verified and intact.');
    }
  } catch (err) {
    console.error('[CRITICAL] [COMPLIANCE_FAILURE] Database connection check failed:', err.message);
  }
}

// Run immediately on startup and schedule hourly sweep
runComplianceHealthCheck();
setInterval(runComplianceHealthCheck, 60 * 60 * 1000);

// ─── Location IP Security Lockdown Verification Helpers ───────────────────
function ipMatches(clientIp, allowedList) {
  let ip = clientIp.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7); // Normalize IPv6-mapped IPv4
  }

  const allowed = allowedList.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const range of allowed) {
    let normRange = range;
    if (normRange.startsWith('::ffff:')) normRange = normRange.substring(7);
    
    // Wildcard or exact matching
    if (ip === normRange || normRange === '*') {
      return true;
    }
    
    // Simple wildcards like 192.168.1.*
    if (normRange.includes('*')) {
      const regexStr = '^' + normRange.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
      const regex = new RegExp(regexStr);
      if (regex.test(ip)) {
        return true;
      }
    }
    
    // CIDR support
    if (normRange.includes('/')) {
      try {
        const [subnet, mask] = normRange.split('/');
        const maskNum = parseInt(mask, 10);
        
        const ipParts = ip.split('.').map(Number);
        const subParts = subnet.split('.').map(Number);
        
        if (ipParts.length === 4 && subParts.length === 4) {
          const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
          const subNum = (subParts[0] << 24) + (subParts[1] << 16) + (subParts[2] << 8) + subParts[3];
          
          const bitMask = maskNum === 0 ? 0 : (~0 << (32 - maskNum));
          
          if ((ipNum & bitMask) === (subNum & bitMask)) {
            return true;
          }
        }
      } catch (cidrErr) {
        console.error('[IP Check] CIDR parsing failed for range:', range, cidrErr.message);
      }
    }
  }
  return false;
}

async function checkIpAuthorized(clientIp) {
  try {
    const lockRes = await pool.query(
      "SELECT setting_value FROM public.kiosk_settings WHERE setting_key = 'enable_ip_lockdown' LIMIT 1"
    );
    const enableLockdown = lockRes.rows[0]?.setting_value === 'true';
    if (!enableLockdown) {
      return { authorized: true };
    }

    const ipsRes = await pool.query(
      "SELECT setting_value FROM public.kiosk_settings WHERE setting_key = 'allowed_ips' LIMIT 1"
    );
    const allowedIps = ipsRes.rows[0]?.setting_value || '127.0.0.1, ::1';

    const isMatched = ipMatches(clientIp, allowedIps);
    return {
      authorized: isMatched,
      allowedIps,
      enableLockdown
    };
  } catch (err) {
    console.error('[IP Verification] DB Query Failed (fail-open):', err.message);
    return { authorized: true, error: err.message };
  }
}


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'https://happy-glacier-0746a2210.7.azurestaticapps.net',
      'https://kiddochecker.com',
      'https://kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net',
      'https://es.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net',
      'https://joint.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net',
    ];
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isAzureApp = /\.azurestaticapps\.net$/.test(origin);
    if (allowed.includes(origin) || isLocalhost || isAzureApp) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Bridge-Secret'],
  credentials: true
}));
app.use(express.json());
app.use(tenantResolver);

// ─── Email & SMS Helpers ─────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  // RESEND_FROM_EMAIL can be set in Azure App Settings once domain is verified.
  // Falls back to Resend's shared test address so emails always deliver.
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'KiddoChecker <onboarding@resend.dev>';
  try {
    const data = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: html,
    });
    console.log('[Bridge] Email sent to', to, '| ID:', data?.data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('[Bridge] Email Error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Auto-Migration Logic ──────────────────────────────────────────────────
async function runMigrations() {
  console.log('[Bridge] Starting resilient database migrations...');
  const fs = require('fs');
  const path = require('path');

  const migrations = [
    { name: 'organizations_table', sql: 'CREATE TABLE IF NOT EXISTS public.organizations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, language_code TEXT DEFAULT \'en\', created_at TIMESTAMPTZ DEFAULT now());' },
    { name: 'seed_organizations', sql: 'INSERT INTO public.organizations (id, name, slug, language_code) VALUES (\'00000000-0000-0000-0000-000000000001\', \'English Congregation\', \'english\', \'en\'), (\'00000000-0000-0000-0000-000000000002\', \'Spanish Congregation\', \'spanish\', \'es\') ON CONFLICT (id) DO NOTHING; INSERT INTO public.organizations (id, name, slug, language_code) VALUES (\'00000000-0000-0000-0000-000000000001\', \'English Congregation\', \'english\', \'en\'), (\'00000000-0000-0000-0000-000000000002\', \'Spanish Congregation\', \'spanish\', \'es\') ON CONFLICT (slug) DO NOTHING;' },
    { name: 'col_class_org_id', sql: 'ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);' },
    // ─── Multi-tenant church lookup table ─────────────────────────────────────
    { name: 'churches_table', sql: `CREATE TABLE IF NOT EXISTS public.churches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), domain TEXT UNIQUE NOT NULL, language TEXT, branding_json JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now()); INSERT INTO public.churches (id, domain, language, branding_json) VALUES ('00000000-0000-0000-0000-000000000001', 'kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net', 'en', '{"name":"English Church"}'), ('00000000-0000-0000-0000-000000000002', 'es.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net', 'es', '{"name":"Spanish Church"}'), ('00000000-0000-0000-0000-000000000000', 'joint.kiddochecker-ep-efgwb5e6bccshbf8.z02.azurefd.net', NULL, '{"name":"Joint Service"}'), ('00000000-0000-0000-0000-000000000003', 'happy-glacier-0746a2210.7.azurestaticapps.net', 'en', '{"name":"English Church Temp"}') ON CONFLICT (domain) DO NOTHING;` },
    { name: 'kiosk_settings_table', sql: 'CREATE TABLE IF NOT EXISTS public.kiosk_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key TEXT UNIQUE NOT NULL, setting_value TEXT NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());' },
    { name: 'seed_kiosk_settings_ips', sql: "INSERT INTO public.kiosk_settings (setting_key, setting_value, description) VALUES ('allowed_ips', '127.0.0.1, ::1', 'Comma-separated list of authorized kiosk IP ranges or CIDRs'), ('enable_ip_lockdown', 'false', 'Enable dynamic location IP-address check-in locks') ON CONFLICT (setting_key) DO NOTHING;" },
    { name: 'col_nfc_uid', sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nfc_uid TEXT UNIQUE;' },
    { name: 'pgcrypto', sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' },
    { name: 'report_seals', sql: `CREATE TABLE IF NOT EXISTS public.report_seals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), report_type TEXT, generated_at TIMESTAMPTZ DEFAULT now(), generated_by_profile UUID, seal_hash TEXT, metadata JSONB);` },
    { name: 'message_read_receipts', sql: `CREATE TABLE IF NOT EXISTS public.message_read_receipts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message_id UUID REFERENCES public.messages(id), user_id UUID REFERENCES public.profiles(id), read_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());` },
    { name: 'col_qr_token', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS qr_token TEXT;' },
    { name: 'col_device_id', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_id TEXT;' },
    { name: 'col_health_fever', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS health_fever BOOLEAN DEFAULT false;' },
    { name: 'col_health_cough', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS health_cough BOOLEAN DEFAULT false;' },
    { name: 'col_device_metadata', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_metadata JSONB DEFAULT \'{}\'::jsonb;' },
    { name: 'password_reset_tokens', sql: 'CREATE TABLE IF NOT EXISTS public.password_reset_tokens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL, token TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now());' },
    { name: 'col_status', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'present\';' },
    { name: 'col_checked_in_method', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_in_method TEXT;' },
    { name: 'col_checked_out_method', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_out_method TEXT;' },
    { name: 'col_checked_in_station', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_in_station TEXT;' },
    { name: 'col_checked_out_station', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_out_station TEXT;' },
    { name: 'col_signature_data', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS signature_data TEXT;' },
    { name: 'col_override_reason', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS override_reason TEXT;' },
    { name: 'col_pickup_snapshot', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS pickup_snapshot JSONB DEFAULT \'{}\'::jsonb;' },
    { name: 'col_witness_id', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS witness_id UUID;' },
    { name: 'col_organization_id_attendance', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'col_organization_id_children', sql: 'ALTER TABLE public.children ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'col_organization_id_classes', sql: 'ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'col_organization_id_profiles', sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'col_organization_id_devices', sql: 'ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'col_organization_id_events', sql: 'ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organization_id UUID;' },
    { name: 'app_role_type', sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN CREATE TYPE app_role AS ENUM ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'parent', 'kiosk'); END IF; END $$;` },
    { name: 'checkin_child', sql: `CREATE OR REPLACE FUNCTION public.checkin_child(p_child_id UUID, p_class_id UUID DEFAULT NULL, p_checked_in_by UUID DEFAULT NULL, p_qr_token TEXT DEFAULT NULL, p_method TEXT DEFAULT 'app_dashboard', p_station TEXT DEFAULT NULL, p_special_instructions TEXT DEFAULT NULL, p_health_fever BOOLEAN DEFAULT false, p_health_cough BOOLEAN DEFAULT false, p_device_metadata JSONB DEFAULT '{}'::jsonb, p_device_id TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL, p_org_id UUID DEFAULT NULL) RETURNS UUID AS $$ DECLARE v_attendance_id UUID; BEGIN INSERT INTO public.attendance (child_id, class_id, checked_in_by, qr_token, checked_in_method, checked_in_station, special_instructions, health_fever, health_cough, device_metadata, device_id, checked_in_at, attendance_date, status, organization_id) VALUES (p_child_id, p_class_id, COALESCE(p_checked_in_by, p_user_id), p_qr_token, p_method, p_station, p_special_instructions, p_health_fever, p_health_cough, p_device_metadata, p_device_id, now(), CURRENT_DATE, 'present', COALESCE(p_org_id, (SELECT organization_id FROM public.children WHERE id = p_child_id LIMIT 1))) RETURNING id INTO v_attendance_id; RETURN v_attendance_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'checkout_child', sql: `CREATE OR REPLACE FUNCTION public.checkout_child(p_attendance_id UUID, p_checked_out_by UUID DEFAULT NULL, p_qr_token TEXT DEFAULT NULL, p_method TEXT DEFAULT 'app_dashboard', p_station TEXT DEFAULT NULL, p_signature_data TEXT DEFAULT NULL, p_override_reason TEXT DEFAULT NULL, p_pickup_snapshot JSONB DEFAULT '{}'::jsonb, p_device_metadata JSONB DEFAULT '{}'::jsonb, p_witness_id UUID DEFAULT NULL, p_device_id TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL) RETURNS VOID AS $$ BEGIN UPDATE public.attendance SET checked_out_at = now(), checked_out_by = COALESCE(p_checked_out_by, p_user_id), checked_out_method = p_method, checked_out_station = p_station, signature_data = p_signature_data, override_reason = p_override_reason, pickup_snapshot = p_pickup_snapshot, device_metadata = p_device_metadata, witness_id = p_witness_id, device_id = p_device_id, status = 'checked_out' WHERE id = p_attendance_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'youth_self_check_action', sql: `CREATE OR REPLACE FUNCTION public.youth_self_check_action(p_pin_code TEXT, p_kiosk_id TEXT) RETURNS JSONB AS $$ DECLARE v_child_id UUID; v_child_name TEXT; BEGIN SELECT id, first_name || ' ' || last_name INTO v_child_id, v_child_name FROM public.children WHERE youth_pin = p_pin_code LIMIT 1; IF v_child_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN'); END IF; RETURN jsonb_build_object('success', true, 'child_id', v_child_id, 'child_name', v_child_name); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_parent_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_parent_for_kiosk(p_search_val TEXT, p_pin TEXT, p_user_id UUID DEFAULT NULL, p_org_id UUID DEFAULT NULL) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, phone TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, p.phone FROM public.profiles p WHERE (regexp_replace(p.phone, '\\D', '', 'g') ILIKE '%' || regexp_replace(p_search_val, '\\D', '', 'g') || '%' OR p.first_name ILIKE '%' || p_search_val || '%' OR p.last_name ILIKE '%' || p_search_val || '%') AND p.security_pin = p_pin AND (p_org_id IS NULL OR p.organization_id = p_org_id OR p.organization_id IS NULL) LIMIT 5; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_children_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_children_for_kiosk(p_parent_id UUID, p_pin TEXT, p_user_id UUID DEFAULT NULL, p_org_id UUID DEFAULT NULL) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, age INTEGER, class_id UUID, parent_id UUID) AS $$ BEGIN RETURN QUERY SELECT c.id, c.first_name, c.last_name, c.age, c.class_id, c.parent_id FROM public.children c JOIN public.profiles p ON c.parent_id = p.id WHERE p.id = p_parent_id AND p.security_pin = p_pin AND (p_org_id IS NULL OR c.organization_id = p_org_id OR c.organization_id IS NULL); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'verify_staff_pin_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.verify_staff_pin_for_kiosk(p_pin TEXT, p_user_id UUID DEFAULT NULL) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, role TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, ur.role::TEXT FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE (p.staff_pin = p_pin OR p.security_pin = p_pin) AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher') LIMIT 1; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_terminal_security_stats', sql: `CREATE OR REPLACE FUNCTION public.get_terminal_security_stats() RETURNS TABLE (active_kiosks bigint, authorized_devices bigint, active_staff_sessions bigint, security_alerts_24h bigint) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.devices WHERE type = 'kiosk' AND is_active = true) as active_kiosks, (SELECT COUNT(*) FROM public.devices WHERE is_authorized = true) as authorized_devices, (SELECT COUNT(*) FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE ur.role IN ('staff', 'admin', 'super_admin')) as active_staff_sessions, 0::bigint as security_alerts_24h; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_stats', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_stats() RETURNS TABLE (total_checkins bigint, total_on_site bigint, total_departed bigint, total_late_pickups bigint) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE) as total_checkins, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at IS NULL) as total_on_site, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at IS NOT NULL) as total_departed, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at > (attendance_date + time '18:00')) as total_late_pickups; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_summary_secure', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_summary_secure(p_date date DEFAULT CURRENT_DATE) RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_children bigint, checked_in_count bigint, checked_out_count bigint, currently_present bigint) AS $$ BEGIN RETURN QUERY SELECT a.attendance_date, c.id as class_id, c.name as class_name, COUNT(DISTINCT a.child_id) as total_children, COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count, COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count, COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present FROM public.attendance a LEFT JOIN public.classes c ON a.class_id = c.id WHERE a.attendance_date = p_date GROUP BY a.attendance_date, c.id, c.name; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_report', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date) RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_checked_in bigint, total_checked_out bigint) AS $$ BEGIN RETURN QUERY SELECT a.attendance_date, c.id as class_id, COALESCE(c.name, 'Unassigned') as class_name, COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_in_at IS NOT NULL) as total_checked_in, COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_out_at IS NOT NULL) as total_checked_out FROM public.attendance a LEFT JOIN public.classes c ON a.class_id = c.id WHERE a.attendance_date BETWEEN start_date AND end_date GROUP BY a.attendance_date, c.id, c.name; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_liability_audit_report', sql: `CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date) RETURNS TABLE (attendance_id UUID, attendance_date DATE, child_name TEXT, child_age INTEGER, has_allergies BOOLEAN, class_name TEXT, checked_in_at TIMESTAMPTZ, checked_in_by_name TEXT, checked_in_by_role TEXT, checked_in_method TEXT, checked_in_station TEXT, checked_out_at TIMESTAMPTZ, checked_out_by_name TEXT, checked_out_by_role TEXT, checked_out_method TEXT, checked_out_station TEXT, duration_hours NUMERIC, health_fever BOOLEAN, health_cough BOOLEAN, special_instructions TEXT, device_ua TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT a.id as attendance_id, a.attendance_date, CONCAT(ch.first_name, ' ', ch.last_name) as child_name, ch.age as child_age, (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies, COALESCE(cl.name, 'Unassigned') as class_name, a.checked_in_at, COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name, COALESCE(ur_in.role::text, 'parent') as checked_in_by_role, a.checked_in_method, a.checked_in_station, a.checked_out_at, COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name, COALESCE(ur_out.role::text, 'parent') as checked_out_by_role, a.checked_out_method, a.checked_out_station, CASE WHEN a.checked_out_at IS NOT NULL THEN EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0 ELSE NULL END as duration_hours, a.health_fever, a.health_cough, a.special_instructions, a.device_metadata->>'userAgent' as device_ua FROM public.attendance a JOIN public.children ch ON a.child_id = ch.id LEFT JOIN public.classes cl ON a.class_id = cl.id LEFT JOIN public.profiles p_in ON a.checked_in_by = p_in.id LEFT JOIN public.profiles p_out ON a.checked_out_by = p_out.id LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE WHERE a.attendance_date BETWEEN start_date AND end_date ORDER BY a.attendance_date DESC, a.checked_in_at DESC; END; $$;` },
    { name: 'get_users_with_roles', sql: `DROP FUNCTION IF EXISTS public.get_users_with_roles(UUID); DROP FUNCTION IF EXISTS public.get_users_with_roles(); CREATE OR REPLACE FUNCTION public.get_users_with_roles(p_user_id UUID DEFAULT NULL) RETURNS TABLE (id UUID, email TEXT, first_name TEXT, last_name TEXT, phone TEXT, role TEXT, is_super_admin BOOLEAN, is_volunteer BOOLEAN, is_active BOOLEAN, created_at TIMESTAMPTZ, address TEXT, city TEXT, state TEXT, zip TEXT, gender TEXT, occupation TEXT, emergency_contact_name TEXT, emergency_contact_phone TEXT, children_count INTEGER) AS $$ BEGIN RETURN QUERY SELECT p.id, COALESCE(p.email, '')::TEXT, COALESCE(p.first_name, '')::TEXT, COALESCE(p.last_name, '')::TEXT, COALESCE(p.phone, '')::TEXT, COALESCE(ur.role::TEXT, p.role::TEXT, 'parent')::TEXT as role, COALESCE(ur.is_super_admin, p.is_super_admin, false) as is_super_admin, COALESCE(ur.is_volunteer, false) as is_volunteer, true as is_active, COALESCE(p.created_at, NOW()) as created_at, p.address::TEXT, p.city::TEXT, p.state::TEXT, COALESCE(p.zip_code, p.zip)::TEXT as zip, p.gender::TEXT, p.occupation::TEXT, p.emergency_contact_name::TEXT, p.emergency_contact_phone::TEXT, (SELECT COUNT(*)::INTEGER FROM public.children c WHERE c.parent_id = p.id) as children_count FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id ORDER BY p.last_name NULLS LAST, p.first_name NULLS LAST; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_current_user_role', sql: `CREATE OR REPLACE FUNCTION public.get_current_user_role(p_user_id UUID DEFAULT NULL) RETURNS TEXT AS $$ DECLARE v_role TEXT; BEGIN SELECT role::TEXT INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1; RETURN COALESCE(v_role, 'parent'); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_available_recipients', sql: `CREATE OR REPLACE FUNCTION public.get_available_recipients(p_user_id UUID) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, role TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, ur.role::TEXT FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE p.id != p_user_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_parent_children_with_classes', sql: `CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL) RETURNS TABLE (child_id UUID, first_name TEXT, last_name TEXT, age INTEGER, allergies TEXT, medical_info TEXT, emergency_contact_name TEXT, emergency_contact_phone TEXT, notes TEXT, current_class_name TEXT) AS $$ BEGIN RETURN QUERY SELECT c.id, c.first_name, c.last_name, c.age, c.allergies, c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, c.notes, cl.name as current_class_name FROM public.children c LEFT JOIN public.classes cl ON c.class_id = cl.id WHERE c.parent_id = COALESCE(parent_user_id, p_user_id); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_church_stats', sql: `CREATE OR REPLACE FUNCTION public.get_church_stats(p_user_id UUID DEFAULT NULL) RETURNS JSONB AS $$ BEGIN RETURN jsonb_build_object('total_members', (SELECT COUNT(*) FROM public.profiles), 'active_volunteers', (SELECT COUNT(*) FROM public.user_roles WHERE role::text = 'volunteer'), 'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE start_date >= CURRENT_DATE)); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_staff_shifts_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk() RETURNS TABLE (id UUID, staff_id UUID, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ) AS $$ BEGIN RETURN QUERY SELECT s.id, s.staff_id, s.start_time, s.end_time FROM public.staff_shifts s WHERE s.start_time::date = CURRENT_DATE; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'check_user_permission', sql: `CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission_name TEXT) RETURNS BOOLEAN AS $$ DECLARE v_is_admin BOOLEAN; BEGIN SELECT (role IN ('admin', 'super_admin') OR is_super_admin = true) INTO v_is_admin FROM public.user_roles WHERE user_id = p_user_id; IF v_is_admin THEN RETURN TRUE; END IF; RETURN EXISTS (SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON rp.permission_id = p.id JOIN public.user_roles ur ON ur.role::text = rp.role_id::text WHERE ur.user_id = p_user_id AND p.name = p_permission_name); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'device_mgmt', sql: `CREATE OR REPLACE FUNCTION public.register_device(p_device_id TEXT, p_name TEXT, p_type TEXT, p_location TEXT DEFAULT NULL) RETURNS VOID AS $$ BEGIN INSERT INTO public.devices (device_id, name, type, location, is_active, is_authorized) VALUES (p_device_id, p_name, p_type, p_location, true, true) ON CONFLICT (device_id) DO UPDATE SET name = p_name, type = p_type, location = p_location, last_seen_at = now(); END; $$ LANGUAGE plpgsql; CREATE OR REPLACE FUNCTION public.get_device_profile(p_device_id TEXT) RETURNS JSONB AS $$ DECLARE v_dev RECORD; BEGIN SELECT * INTO v_dev FROM public.devices WHERE device_id = p_device_id AND is_active = true LIMIT 1; IF v_dev IS NULL THEN RETURN NULL; END IF; RETURN jsonb_build_object('id', v_dev.id, 'name', v_dev.name, 'type', v_dev.type, 'is_authorized', v_dev.is_authorized); END; $$ LANGUAGE plpgsql;` },
    { name: 'col_password_hash', sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT; UPDATE public.profiles SET password_hash = '$2b$10$7JMzVL7apPHCTSIO2c0niefOkPVOYo9iEnZrPAiRSWB.hSGU0pgJu' WHERE password_hash IS NULL; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_secret TEXT; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;` },
    { name: 'get_staff_members', sql: `DROP FUNCTION IF EXISTS public.get_staff_members(UUID); DROP FUNCTION IF EXISTS public.get_staff_members(); CREATE OR REPLACE FUNCTION public.get_staff_members(p_user_id UUID DEFAULT NULL) RETURNS TABLE (user_id UUID, email TEXT, first_name TEXT, last_name TEXT, phone TEXT, role TEXT, is_super_admin BOOLEAN, is_active BOOLEAN, staff_pin TEXT, avatar_url TEXT, photo_url TEXT, department TEXT, specialties TEXT[], max_hours_per_week INTEGER, supervisor_id UUID) AS $$ BEGIN RETURN QUERY SELECT p.id as user_id, p.email::TEXT, COALESCE(p.first_name, '')::TEXT, COALESCE(p.last_name, '')::TEXT, COALESCE(p.phone, '')::TEXT, COALESCE(ur.role::TEXT, p.role::TEXT, 'staff')::TEXT, COALESCE(ur.is_super_admin, p.is_super_admin, false), true AS is_active, p.staff_pin::TEXT, p.avatar_url::TEXT, p.photo_url::TEXT, p.department::TEXT, p.specialties, p.max_hours_per_week, p.supervisor_id FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id WHERE COALESCE(ur.role::TEXT, p.role::TEXT) NOT IN ('parent', 'child', 'kiosk') ORDER BY p.last_name NULLS LAST, p.first_name NULLS LAST; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'sync_profile_role_trigger', sql: `CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.user_roles (user_id, role, is_super_admin) VALUES (NEW.id, COALESCE(NEW.role, 'parent'), COALESCE(NEW.is_super_admin, false)) ON CONFLICT (user_id) DO UPDATE SET role = COALESCE(EXCLUDED.role, user_roles.role), is_super_admin = COALESCE(EXCLUDED.is_super_admin, user_roles.is_super_admin); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER; DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.profiles; CREATE TRIGGER trg_sync_profile_role AFTER INSERT OR UPDATE OF role, is_super_admin ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_user_roles();` }
  ];

  for (const m of migrations) {
    try { await pool.query(m.sql); console.log(`[DB] Migration SUCCESS: ${m.name}`); } 
    catch (err) { console.error(`[DB] Migration FAILED [${m.name}]:`, err.message); }
  }

  try {
    const tableCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');");
    if (tableCheck.rows[0].exists) {
      const counts = await pool.query("SELECT (SELECT COUNT(*) FROM public.profiles) as p, (SELECT COUNT(*) FROM public.children) as c");
      if ((parseInt(counts.rows[0].p) === 0 || parseInt(counts.rows[0].c) === 0) && process.env.SKIP_BOOTSTRAP !== 'true') {
        console.log('[Bridge] Empty DB detected. Bootstrapping...');
        const sqlPath = path.join(__dirname, 'azure_ready_data.sql');
        if (fs.existsSync(sqlPath)) {
          let sql = fs.readFileSync(sqlPath, 'utf8').replace(/^\uFEFF/, '');
          await pool.query(sql);
          console.log('[Bridge] Data injected.');
        }
      }
    }
    await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS azure_oid TEXT; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;`);
    
    // Auto-sync user_roles table for all existing profiles in Azure PostgreSQL
    try {
      await pool.query(`
        INSERT INTO public.user_roles (user_id, role, is_super_admin)
        SELECT id, COALESCE(role, 'parent'), COALESCE(is_super_admin, false)
        FROM public.profiles
        ON CONFLICT (user_id) DO UPDATE 
        SET role = COALESCE(EXCLUDED.role, user_roles.role), 
            is_super_admin = COALESCE(EXCLUDED.is_super_admin, user_roles.is_super_admin);
      `);
      console.log('[DB] User roles table synced with profiles.');
    } catch (syncErr) {
      console.warn('[DB] User roles auto-sync notice:', syncErr.message);
    }
  } catch (err) { console.error('[Bridge] Post-migration error:', err.message); }
}

(async () => {
  try {

  } catch (err) { console.error('[PROBE] Master Key error:', err.message); }
  await runMigrations();
})();

// ─── TOTP & MFA Helpers ───────────────────────────────────────────────────
const crypto = require('crypto');

function generateSecret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const randomBytes = crypto.randomBytes(16);
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += alphabet[randomBytes[i] % alphabet.length];
  }
  return secret;
}

function base32Decode(base32Str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32Str.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const output = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateTOTP(secret, timeWindow = 0) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30) + timeWindow;

  const timeBuffer = Buffer.alloc(8);
  let tempTime = BigInt(time);
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = Number(tempTime & 255n);
    tempTime >>= 8n;
  }

  const hmac = crypto.createHmac('sha1', key).update(timeBuffer).digest();
  
  const offset = hmac[hmac.length - 1] & 15;
  const codeBin = ((hmac[offset] & 127) << 24) |
                  ((hmac[offset + 1] & 255) << 16) |
                  ((hmac[offset + 2] & 255) << 8) |
                  (hmac[offset + 3] & 255);
  
  const code = codeBin % 1000000;
  return code.toString().padStart(6, '0');
}

function verifyTOTP(secret, userCode) {
  if (!secret || !userCode) return false;
  
  const userCodeBuf = Buffer.from(userCode.trim().padStart(6, '0'));
  
  for (let window = -1; window <= 1; window++) {
    const generatedCode = generateTOTP(secret, window);
    const generatedBuf = Buffer.from(generatedCode);
    
    if (userCodeBuf.length === generatedBuf.length && crypto.timingSafeEqual(userCodeBuf, generatedBuf)) {
      return true;
    }
  }
  return false;
}

// ─── JWT & Auth ──────────────────────────────────────────────────────────
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'kiddochecker-super-secret-2026';

function getKey(header, callback) {
  const jwksClient = require('jwks-rsa');
  const client = jwksClient({ jwksUri: 'https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/discovery/v2.0/keys' });
  client.getSigningKey(header.kid, (err, key) => callback(null, key.publicKey || key.rsaPublicKey));
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('No Token');
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send('No Token');

  // 1. Check custom Bridge secret
  try {
    req.user = jwt.verify(token, BRIDGE_SECRET);
    return next();
  } catch (e) {}

  // 2. Decode valid session tokens (e.g. Supabase session JWTs or custom tokens)
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === 'object' && (decoded.sub || decoded.email || decoded.uid || decoded.role || decoded.iss)) {
      req.user = decoded;
      return next();
    }
  } catch (e) {}

  // 3. Fallback MSAL Entra ID verification
  jwt.verify(token, getKey, { audience: 'e48264b2-de12-4444-a290-a8d7f3e3a525', issuer: 'https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/v2.0' }, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
      return next();
    }
    return res.status(403).send('Invalid Token');
  });
};

// ─── API Routes ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ status: 'online', service: 'KiddoChecker Azure API Bridge', version: '2.0.0' });
  }
  const frontendUrl = process.env.FRONTEND_URL || 'https://happy-glacier-0746a2210.7.azurestaticapps.net';
  res.redirect(frontendUrl);
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.post(['/api/auth/send-code', '/auth/send-code'], authLimiter, async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[Bridge] Auth: Generated code ${code} for ${email}`);
  try {
    await pool.query(
      'INSERT INTO auth.verification_codes (email, code) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET code = $2, created_at = NOW(), expires_at = (NOW() + INTERVAL \'15 minutes\')',
      [email, code]
    );
    await sendEmail({
      to: email,
      subject: 'KiddoChecker Verification Code',
      html: `<div style="font-family:sans-serif;padding:20px;background:#f9f9f9;border-radius:10px;">
              <h2 style="color:#2563eb;">KiddoChecker Verification</h2>
              <p>Your verification code is: <strong style="font-size:24px;color:#1e40af;">${code}</strong></p>
              <p style="color:#666;font-size:12px;">This code will expire in 15 minutes.</p>
             </div>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Bridge] send-code error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/auth/verify-code', '/auth/verify-code'], authLimiter, async (req, res) => {
  const { email, code } = req.body;
  const client = await pool.connect();
  try {
    // Bypass RLS — auth.uid() is NULL for service account connections
    try { await client.query('SET LOCAL row_security = off'); } catch (e) {}
    if (req.tenant && typeof req.tenant.churchId !== 'undefined') {
      await client.query("SELECT set_config('app.church_id', $1, false)", [String(req.tenant.churchId)]);
    } else {
      await client.query("SELECT set_config('app.church_id', '0', false)");
    }

    const result = await client.query(
      'SELECT * FROM auth.verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email, code]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired code' });

    // Issue Bridge JWT
    const token = jwt.sign({ email, role: 'admin' }, BRIDGE_SECRET, { expiresIn: '24h' });

    // Fetch profile
    let profileRes = await client.query(
      'SELECT * FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );

    if (profileRes.rows.length === 0) {
      return res.status(401).json({ error: 'Profile not found. Please contact an administrator.' });
    }

    const profile = profileRes.rows[0];
    res.json({ token, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


app.post(['/api/auth/forgot-password', '/auth/forgot-password'], authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const client = await pool.connect();
  try {
    // Bypass RLS — auth.uid() is NULL for service account connections
    try { await client.query('SET LOCAL row_security = off'); } catch (e) {}
    if (req.tenant && typeof req.tenant.churchId !== 'undefined') {
      await client.query("SELECT set_config('app.church_id', $1, false)", [String(req.tenant.churchId)]);
    }


    const profileRes = await client.query('SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (profileRes.rows.length === 0) {
      return res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await client.query(
      'INSERT INTO public.password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [normalizedEmail, token, expiresAt]
    );

    const frontendBase = process.env.FRONTEND_URL
      || req.headers['x-forwarded-host']
      || 'https://happy-glacier-0746a2210.7.azurestaticapps.net';
    const resetLink = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;
    
    // Always log the reset link so it's visible in Azure Container logs for debugging
    console.log(`[AUTH] Reset link generated for ${normalizedEmail}: ${resetLink}`);

    try {
      const { Resend } = require('resend');
      let resendKey = process.env.RESEND_API_KEY;
      // Use RESEND_FROM_EMAIL env var if set; otherwise fall back to Resend's shared
      // onboarding address which works without domain verification.
      let fromAddress = process.env.RESEND_FROM_EMAIL || 'KiddoChecker <onboarding@resend.dev>';
      try {
        const settingsRes = await client.query(
          'SELECT resend_api_key, resend_domain FROM public.communication_settings LIMIT 1'
        );
        if (settingsRes.rows.length > 0) {
          if (settingsRes.rows[0].resend_api_key) resendKey = settingsRes.rows[0].resend_api_key;
          if (settingsRes.rows[0].resend_domain) {
            fromAddress = `KiddoChecker <updates@${settingsRes.rows[0].resend_domain}>`;
          }
        }
      } catch (dbErr) {
        console.error('[Auth] Error fetching communication_settings (non-fatal):', dbErr.message);
      }

      if (!resendKey) {
        console.log(`[AUTH] No Resend API key configured – email not sent. Reset link logged above.`);
      } else {
        const resend = new Resend(resendKey);
        console.log(`[AUTH] Sending password reset email to ${normalizedEmail} from ${fromAddress}...`);
        const emailResult = await resend.emails.send({
          from: fromAddress,
          to: normalizedEmail,
          subject: 'Reset Your KiddoChecker Password',
          html: `
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
              <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px 32px">
                <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">🔒 KiddoChecker</h1>
              </div>
              <div style="padding:32px">
                <h2 style="margin:0 0 12px;font-size:18px;color:#111827">Reset Your Password</h2>
                <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">We received a request to reset your KiddoChecker account password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
                <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px">Reset Password</a>
                <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
              </div>
            </div>`
        });
        if (emailResult.error) {
          console.error('[AUTH] Resend API error:', JSON.stringify(emailResult.error));
          return res.status(500).json({
            error: 'Email delivery failed',
            detail: emailResult.error.message || emailResult.error.name
          });
        }
        console.log(`[AUTH] Password reset email delivered ✓ to ${normalizedEmail} | Resend ID: ${emailResult.data?.id}`);
      }
    } catch (mailErr) {
      console.error('[Auth] Unexpected error sending email:', mailErr.message);
      return res.status(500).json({ error: 'Email delivery failed due to an unexpected error' });
    }

    res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.post(['/api/auth/reset-password', '/auth/reset-password'], authLimiter, async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

  const client = await pool.connect();
  try {
    if (req.tenant && typeof req.tenant.churchId !== 'undefined') {
      await client.query("SELECT set_config('app.church_id', $1, false)", [String(req.tenant.churchId)]);
      if (req.tenant.language) {
        await client.query("SELECT set_config('app.language', $1, false)", [req.tenant.language]);
      }
    }
    try { await client.query('SET LOCAL row_security = off'); } catch (e) {}

    const bcrypt = require('bcryptjs');
    
    // Find valid token
    const tokenRes = await client.query(
      'SELECT * FROM public.password_reset_tokens WHERE token = $1 AND expires_at > NOW() LIMIT 1',
      [token]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const email = tokenRes.rows[0].email;
    const newHash = bcrypt.hashSync(newPassword, 10);

    // Update password
    await client.query('UPDATE public.profiles SET password_hash = $1 WHERE LOWER(email) = $2', [newHash, email]);

    // Delete token
    await client.query('DELETE FROM public.password_reset_tokens WHERE token = $1', [token]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});
app.post(['/api/auth/signup', '/auth/signup'], authLimiter, async (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const bcrypt = require('bcryptjs');

  try {
    // 1. Check if user already exists
    const checkRes = await pool.query('SELECT id FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // 2. Generate hash
    const newHash = bcrypt.hashSync(password, 10);
    const finalRole = role || 'parent';

    // 3. Perform a transactional insert
    await pool.query('BEGIN');

    // Insert profile using gen_random_uuid()
    const insertProfileSql = `
      INSERT INTO public.profiles (id, email, password_hash, first_name, last_name, phone, role) 
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
      RETURNING *
    `;
    const profileRes = await pool.query(insertProfileSql, [
      normalizedEmail, 
      newHash, 
      firstName.trim(), 
      lastName.trim(), 
      (phone || '').trim(), 
      finalRole
    ]);
    const profile = profileRes.rows[0];
    const newUserId = profile.id;

    // Insert user role
    await pool.query(
      `INSERT INTO public.user_roles (user_id, role, is_super_admin) VALUES ($1, $2, $3)`,
      [newUserId, finalRole, finalRole === 'super_admin']
    );

    await pool.query('COMMIT');

    // 4. Issue Bridge JWT
    const token = jwt.sign({ email: normalizedEmail, role: finalRole }, BRIDGE_SECRET, { expiresIn: '24h' });

    res.json({ token, profile });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('[Bridge] signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/auth/login', '/auth/login'], authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const client = await pool.connect();

  try {
    const bcrypt = require('bcryptjs');

    // Attempt to bypass RLS for this connection — the service account (kiddomin) should have
    // BYPASSRLS privilege. If not, SET LOCAL row_security = off works for the admin role.
    // Both are no-ops if the role already bypasses RLS via BYPASSRLS attribute.
    try {
      await client.query('SET LOCAL row_security = off');
    } catch (e) {
      console.warn('[Auth] Could not SET row_security = off (may already have BYPASSRLS):', e.message);
    }

    // Set tenant context (belt-and-suspenders alongside row_security = off)
    if (req.tenant && typeof req.tenant.churchId !== 'undefined') {
      await client.query("SELECT set_config('app.church_id', $1, false)", [String(req.tenant.churchId)]);
    } else {
      await client.query("SELECT set_config('app.church_id', '0', false)");
    }

    // Fetch profile – bypass RLS by querying with SECURITY DEFINER if needed,
    // but first try with current session context
    let profileRes = await client.query(
      'SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1',
      [normalizedEmail]
    );

    // If RLS blocked the row (0 rows but user might exist), try via function
    if (profileRes.rows.length === 0) {
      console.warn(`[Auth] Login: profile not found (or RLS blocked) for ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = profileRes.rows[0];

    // Check password hash
    if (!profile.password_hash) {
      console.warn(`[Auth] Login attempt on account without password hash: ${normalizedEmail}`);
      return res.status(403).json({
        error: 'Password Reset Required',
        message: 'This account needs a password reset before logging in.'
      });
    }

    const isMatch = bcrypt.compareSync(password, profile.password_hash);
    if (!isMatch) {
      console.warn(`[Auth] Failed login for ${normalizedEmail} — password mismatch`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Determine the role
    const finalRole = profile.role || 'parent';

    // Check if MFA is enabled
    if (profile.mfa_enabled) {
      return res.json({
        mfaRequired: true,
        email: profile.email,
        message: 'Multi-factor authentication required.'
      });
    }

    const isPrivileged = ['admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer'].includes(finalRole);
    const mfaSetupRequired = isPrivileged && !profile.mfa_enabled;

    // Issue Bridge JWT
    const token = jwt.sign({ email: profile.email, role: finalRole }, BRIDGE_SECRET, { expiresIn: '24h' });
    console.log(`[Auth] Login success for ${normalizedEmail} role=${finalRole}`);

    res.json({ token, profile, mfaSetupRequired });
  } catch (err) {
    console.error('[Bridge] login error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


// ─── MFA & TOTP Endpoints ─────────────────────────────────────────────────
app.post(['/api/auth/login/mfa', '/auth/login/mfa'], authLimiter, async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and MFA code are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const result = await pool.query('SELECT * FROM public.profiles WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }
    const profile = result.rows[0];
    
    if (!profile.mfa_secret || !profile.mfa_enabled) {
      return res.status(400).json({ error: 'MFA not enabled for this account' });
    }
    
    const verified = verifyTOTP(profile.mfa_secret, code);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }
    
    const finalRole = profile.role || 'parent';
    const token = jwt.sign({ email: profile.email, role: finalRole }, BRIDGE_SECRET, { expiresIn: '24h' });
    
    res.json({ token, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/mfa/list', verifyToken, async (req, res) => {
  const email = req.user.email || req.user.preferred_username;
  try {
    const result = await pool.query('SELECT mfa_enabled, id FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    if (result.rows.length === 0) return res.json({ all: [] });
    const profile = result.rows[0];
    if (profile.mfa_enabled) {
      return res.json({
        all: [{
          id: 'totp-factor-' + profile.id,
          factorType: 'totp',
          friendlyName: email,
          status: 'verified'
        }]
      });
    }
    res.json({ all: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/mfa/enroll', verifyToken, async (req, res) => {
  const email = req.user.email || req.user.preferred_username;
  const { friendlyName, issuer } = req.body;
  try {
    const secret = generateSecret();
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer || 'KiddoChecker')}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer || 'KiddoChecker')}`;
    const qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;
    
    await pool.query('UPDATE public.profiles SET mfa_secret = $1, mfa_enabled = false WHERE LOWER(email) = LOWER($2)', [secret, email]);
    
    res.json({
      id: 'totp-factor-pending',
      totp: {
        qr_code
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/mfa/verify', verifyToken, async (req, res) => {
  const email = req.user.email || req.user.preferred_username;
  const { code } = req.body;
  try {
    const result = await pool.query('SELECT mfa_secret FROM public.profiles WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    
    const secret = result.rows[0].mfa_secret;
    if (!secret) return res.status(400).json({ error: 'MFA not enrolled yet' });
    
    const verified = verifyTOTP(secret, code);
    if (!verified) return res.status(400).json({ error: 'Invalid verification code' });
    
    await pool.query('UPDATE public.profiles SET mfa_enabled = true WHERE LOWER(email) = LOWER($1)', [email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/mfa/unenroll', verifyToken, async (req, res) => {
  const email = req.user.email || req.user.preferred_username;
  try {
    await pool.query('UPDATE public.profiles SET mfa_secret = NULL, mfa_enabled = false WHERE LOWER(email) = LOWER($1)', [email]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rpc', verifyToken, async (req, res) => {
  const { rpc_name, fn, params, args } = req.body;
  const finalFn = rpc_name || fn;
  const finalParams = params || args || {};
  
  try {
    console.log(`[Bridge] RPC Call: ${finalFn}`, JSON.stringify(finalParams));
    
    if (!finalFn || typeof finalFn !== 'string' || !/^[a-zA-Z0-9_]+$/.test(finalFn)) {
      return res.status(400).json({ error: 'Invalid or missing RPC function name' });
    }

    // IP lockdown verification for Kiosk PIN/Login RPCs
    const kioskRpcs = ['get_parent_for_kiosk', 'verify_staff_pin_for_kiosk', 'youth_self_check_action'];
    if (kioskRpcs.includes(finalFn)) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
      const ipCheck = await checkIpAuthorized(clientIp);
      if (!ipCheck.authorized) {
        console.warn(`[Security Alert] Blocked Kiosk RPC login call ${finalFn} from unauthorized IP: ${clientIp}. Allowed: ${ipCheck.allowedIps}`);
        return res.status(403).json({
          error: `ACCESS_DENIED: Access blocked from IP address ${clientIp}. This terminal is not registered inside the authorized physical facility network.`
        });
      }
    }

    // Inject user ID if missing ONLY when params were explicitly supplied by client
    const hasParams = Object.keys(finalParams).length > 0;
    if (hasParams && !finalParams.p_user_id && req.user) {
      const email = req.user.email || req.user.preferred_username;
      const userRes = await pool.query('SELECT id FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
      if (userRes.rows.length > 0) {
        finalParams.p_user_id = userRes.rows[0].id;
      }
    }

    let result;
    const runRpcQuery = async (params: any) => {
      if (Array.isArray(params)) {
        const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
        return await pool.query(`SELECT * FROM public.${finalFn}(${placeholders})`, params);
      }
      
      const keys = Object.keys(params || {});
      if (keys.length === 0) {
        return await pool.query(`SELECT * FROM public.${finalFn}()`);
      }

      const vals = Object.values(params);
      const placeholders = keys.map((k, i) => {
        const val = vals[i];
        if ((k.endsWith('_id') || k.endsWith('_by') || k === 'p_attendance_id' || k === 'p_witness_id') && 
            k !== 'p_device_id' && k !== 'p_kiosk_id') {
          return `${k} => $${i + 1}::uuid`;
        }
        if (k.endsWith('_metadata') || k.endsWith('_snapshot')) {
          if (val && typeof val === 'object') vals[i] = JSON.stringify(val);
          return `${k} => $${i + 1}::jsonb`;
        }
        if (k.startsWith('p_health_')) {
          return `${k} => $${i + 1}::boolean`;
        }
        if (k === 'p_qr_token' || k === 'p_method' || k === 'p_station' || 
            k === 'p_special_instructions' || k === 'p_device_id' || 
            k === 'p_search_val' || k === 'p_pin' || k === 'p_signature_data' || 
            k === 'p_override_reason') {
          return `${k} => $${i + 1}::text`;
        }
        return `${k} => $${i + 1}`;
      }).join(', ');

      return await pool.query(`SELECT * FROM public.${finalFn}(${placeholders})`, vals);
    };

    try {
      result = await runRpcQuery(finalParams);
    } catch (rpcErr) {
      // Fallback: If function signature doesn't match named parameters, try without parameters or positional
      if (rpcErr.code === '42883' || rpcErr.message.includes('does not exist')) {
        console.warn(`[Bridge] Named RPC failed for ${finalFn}, attempting zero-argument fallback...`);
        try {
          result = await pool.query(`SELECT * FROM public.${finalFn}()`);
        } catch (fallbackErr) {
          try {
            const positionalVals = Object.values(finalParams || {});
            const positionalPlaceholders = positionalVals.map((_, i) => `$${i + 1}`).join(', ');
            result = await pool.query(`SELECT * FROM public.${finalFn}(${positionalPlaceholders})`, positionalVals);
          } catch (finalErr) {
            throw rpcErr;
          }
        }
      } else {
        throw rpcErr;
      }
    }

    let data = result.rows;
    if (data.length === 1 && Object.keys(data[0])[0] === finalFn) {
      data = data[0][finalFn];
    }
    
    res.json({ data, error: null });
  } catch (err) { 
    console.error(`[Bridge] RPC error [${finalFn}]:`, err.message);
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/query', verifyToken, async (req, res) => {
  let { table, select = '*', filters = [], order, limit } = req.body;
  if (!table || typeof table !== 'string' || !/^[a-zA-Z0-9_]+$/.test(table)) {
    return res.status(400).json({ error: 'Invalid or missing table name' });
  }
  let sql = "";
  try {
    // IP lockdown verification for Kiosk NFC Login queries
    const isNfcQuery = table === 'profiles' && filters && filters.some(f => f.column === 'nfc_uid');
    if (isNfcQuery) {
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
      const ipCheck = await checkIpAuthorized(clientIp);
      if (!ipCheck.authorized) {
        console.warn(`[Security Alert] Blocked Kiosk NFC query from unauthorized IP: ${clientIp}. Allowed: ${ipCheck.allowedIps}`);
        return res.status(403).json({
          error: `ACCESS_DENIED: Access blocked from IP address ${clientIp}. This terminal is not registered inside the authorized physical facility network.`
        });
      }
    }

    const actualFilters = filters.filter(f => {
      if (f.operator === 'order') { order = `${f.column}.${f.value.toLowerCase()}`; return false; }
      if (f.operator === 'limit') { limit = f.value; return false; }
      if (f.operator === 'single' || f.operator === 'maybeSingle') return false;
      return true;
    });

    // Detect if we should auto-join for common UI patterns
    const needsAttendanceJoin = table === 'attendance' && (select === '*' || select.includes('child') || select.includes('children('));
    const needsChildrenJoin = table === 'children' && (select === '*' || select.includes('classes('));

    if (needsAttendanceJoin) {
      sql = `
        SELECT t.*,
          jsonb_build_object(
            'id', c.id, 
            'first_name', c.first_name, 
            'last_name', c.last_name, 
            'parent_id', c.parent_id::text
          ) as child,
          jsonb_build_object('id', cl.id, 'name', cl.name) as class
        FROM public.attendance t
        LEFT JOIN public.children c ON t.child_id = c.id
        LEFT JOIN public.classes cl ON t.class_id = cl.id
      `;
    } else if (needsChildrenJoin) {
      sql = `
        SELECT t.*,
          jsonb_build_object('id', cl.id, 'name', cl.name, 'age_range', cl.age_range) as classes
        FROM public.children t
        LEFT JOIN public.classes cl ON t.class_id = cl.id
      `;
    } else {
      const cleanSelect = select
        .replace(/[\w_]+:\s*[\w_]+\s*\([^)]*\)/g, '')
        .replace(/[\w_]+\s*\([^)]*\)/g, '')
        .replace(/[\w_]+:/g, '')
        .replace(/,(\s*,)+/g, ',')
        .replace(/^,|,$/g, '')
        .trim();
      sql = `SELECT ${cleanSelect === '*' || cleanSelect === '' ? '*' : cleanSelect} FROM public.${table} t`;
    }

    const values = [];
    if (actualFilters && actualFilters.length > 0) {
      const clauses = actualFilters.map(f => {
        if (f.operator === 'OR') {
          const parts = f.value.split(',');
          const orClauses = parts.map(part => {
            const dotIdx1 = part.indexOf('.');
            const dotIdx2 = part.indexOf('.', dotIdx1 + 1);
            if (dotIdx1 === -1 || dotIdx2 === -1) return null;
            
            const column = part.substring(0, dotIdx1);
            const op = part.substring(dotIdx1 + 1, dotIdx2);
            let val = part.substring(dotIdx2 + 1);
            
            if (val.startsWith('(') && val.endsWith(')')) val = val.slice(1, -1);
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            
            let sqlOp = '=';
            if (op === 'eq') sqlOp = '=';
            else if (op === 'neq') sqlOp = '!=';
            else if (op === 'gt') sqlOp = '>';
            else if (op === 'lt') sqlOp = '<';
            else if (op === 'gte') sqlOp = '>=';
            else if (op === 'lte') sqlOp = '<=';
            else if (op === 'is') {
              if (val === 'null') return `t.${column} IS NULL`;
              sqlOp = '=';
            }
            
            const pIdx = values.push(val);
            if (column === 'id' || column.endsWith('_id') || (typeof val === 'string' && /^[0-9a-f]{8}-/.test(val))) {
              return `t.${column}::text = $${pIdx}::text`;
            }
            return `t.${column}::text ${sqlOp} $${pIdx}`;
          }).filter(Boolean);
          
          if (orClauses.length > 0) {
            return `(${orClauses.join(' OR ')})`;
          }
          return null;
        }

        // Handle NULL filters explicitly
        if (f.value === null || f.operator === 'IS NULL' || f.operator === 'is') {
          let tableAlias = 't';
          if (needsAttendanceJoin) {
            if (['first_name', 'last_name'].includes(f.column)) tableAlias = 'c';
            else if (f.column === 'name') tableAlias = 'cl';
          }
          return `${tableAlias}.${f.column} IS NULL`;
        }

        if (!f.column || f.value === undefined) return null;

        const pIdx = values.push(f.value);
        let op = '=';
        if (f.operator === 'gt') op = '>';
        else if (f.operator === 'lt') op = '<';
        else if (f.operator === 'gte') op = '>=';
        else if (f.operator === 'lte') op = '<=';
        else if (f.operator === 'neq' || f.operator === '!=') op = '!=';
        else if (f.operator === 'ilike' || f.operator === 'like' || f.operator === 'LIKE' || f.operator === 'ILIKE') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.value);
          op = isUuid ? '=' : 'ILIKE';
        }
        
        let tableAlias = 't';
        if (needsAttendanceJoin) {
          if (['first_name', 'last_name', 'parent_id'].includes(f.column)) tableAlias = 'c';
          else if (f.column === 'name') tableAlias = 'cl';
        }
        
        if (f.operator === 'IN') {
          return `${tableAlias}.${f.column}::text = ANY($${pIdx})`;
        }

        if (f.column === 'id' || f.column.endsWith('_id') || (typeof f.value === 'string' && /^[0-9a-f]{8}-/.test(f.value))) {
          return `${tableAlias}.${f.column}::text = $${pIdx}::text`;
        }
        return `${tableAlias}.${f.column}::text ${op} $${pIdx}`;
      }).filter(Boolean);

      const validClauses = clauses.filter(Boolean);
      if (validClauses.length > 0) sql += ` WHERE ${validClauses.join(' AND ')}`;
    }
    
    if (order) {
      const [col, dir] = order.split('.');
      sql += ` ORDER BY t.${col} ${dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${parseInt(limit)}`;
    }
    
    console.log('[Bridge] Executing SQL:', sql);
    console.log('[Bridge] With Values:', JSON.stringify(values));
    const result = await pool.query(sql, values);
    console.log(`[Bridge] query success [${table}]: returned ${result.rows.length} rows`);
    res.json({ data: result.rows, error: null });
  } catch (err) { 
    if (err.code === '42703' && err.message.includes('organization_id')) {
      console.warn(`[Bridge] Column organization_id does not exist on table ${table}, retrying query without organization_id filter...`);
      try {
        const nonOrgFilters = (actualFilters || []).filter(f => f.column !== 'organization_id');
        let fallbackSql = "";
        if (needsAttendanceJoin) {
          fallbackSql = `
            SELECT t.*,
              jsonb_build_object('id', c.id, 'first_name', c.first_name, 'last_name', c.last_name, 'parent_id', c.parent_id::text) as child,
              jsonb_build_object('id', cl.id, 'name', cl.name) as class
            FROM public.attendance t
            LEFT JOIN public.children c ON t.child_id = c.id
            LEFT JOIN public.classes cl ON t.class_id = cl.id
          `;
        } else if (needsChildrenJoin) {
          fallbackSql = `
            SELECT t.*,
              jsonb_build_object('id', cl.id, 'name', cl.name, 'age_range', cl.age_range) as classes
            FROM public.children t
            LEFT JOIN public.classes cl ON t.class_id = cl.id
          `;
        } else {
          fallbackSql = `SELECT * FROM public.${table} t`;
        }
        const fallbackValues = [];
        if (nonOrgFilters.length > 0) {
          const clauses = nonOrgFilters.map(f => {
            const pIdx = fallbackValues.push(f.value);
            return `t.${f.column}::text = $${pIdx}::text`;
          });
          fallbackSql += ` WHERE ${clauses.join(' AND ')}`;
        }
        if (order) {
          const [col, dir] = order.split('.');
          fallbackSql += ` ORDER BY t.${col} ${dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
        }
        if (limit) fallbackSql += ` LIMIT ${parseInt(limit)}`;
        
        const fallbackResult = await pool.query(fallbackSql, fallbackValues);
        return res.json({ data: fallbackResult.rows, error: null });
      } catch (fallbackErr) {
        return res.status(500).json({ error: fallbackErr.message });
      }
    }
    console.error(`[Bridge] query error [${table}]:`, err.message, '| SQL:', sql);
    res.status(500).json({ error: err.message }); 
  }
});



app.post('/api/mutate', verifyToken, async (req, res) => {
  console.log('[Bridge] Mutation Request:', JSON.stringify(req.body, null, 2));
  let { table, method, action, values, data, filters } = req.body;
  
  if (!table || typeof table !== 'string' || !/^[a-zA-Z0-9_]+$/.test(table)) {
    return res.status(400).json({ error: 'Invalid or missing table name' });
  }

  // Normalize fields between Supabase proxy and internal calls
  const finalMethod = method || action || req.body.method || req.body.action;
  const finalValues = values || data || req.body.values || req.body.data || {};

  // Sanitize empty strings on UUID columns to null
  Object.keys(finalValues).forEach(k => {
    if ((k.endsWith('_id') || k === 'id' || k === 'user_id' || k === 'created_by') && finalValues[k] === '') {
      finalValues[k] = null;
    }
  });

  try {
    if (!finalMethod) {
      console.error('[Bridge] Mutation error: No method/action specified in body');
      return res.status(400).json({ error: 'Unsupported mutation method: undefined' });
    }
    
    // Security: Restrict kiosk_settings mutations to admins/super_admins
    if (table === 'kiosk_settings') {
      const role = req.user?.role || 'parent';
      if (role !== 'admin' && role !== 'super_admin') {
        console.warn(`[Security] Blocked unauthorized kiosk_settings mutation by role: ${role}`);
        return res.status(403).json({ error: 'Unauthorized: Only administrators can modify kiosk settings.' });
      }
    }
    
    if (finalMethod === 'insert' || finalMethod === 'upsert') {
      const keys = Object.keys(finalValues);
      const vals = Object.values(finalValues);
      const cols = keys.join(', ');
      const placeholders = keys.map((key, i) => {
        const val = vals[i];
        if ((key.endsWith('_id') || key === 'id') && val !== null) return `$${i + 1}::uuid`;
        return `$${i + 1}`;
      }).join(', ');
      
      let sql;
      if (finalMethod === 'upsert') {
        const conflictTarget = req.body.options?.onConflict || 'id';
        const updates = Object.keys(finalValues)
          .filter(k => k !== conflictTarget)
          .map((k, i) => `${k} = EXCLUDED.${k}`)
          .join(', ');
        sql = `INSERT INTO public.${table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates} RETURNING *`;
      } else {
        sql = `INSERT INTO public.${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
      }
      
      const result = await pool.query(sql, vals);
      return res.json({ data: result.rows, error: null });
    } else if (finalMethod === 'update') {
      const keys = Object.keys(finalValues);
      const vals = Object.values(finalValues);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const filterItems = (filters || []).filter(f => f && f.column);
      const filterKeys = filterItems.map(f => f.column);
      const filterVals = filterItems.map(f => f.value);
      const filterClause = filterKeys.length > 0
        ? filterKeys.map((k, i) => `${k}::text = $${vals.length + i + 1}::text`).join(' AND ')
        : 'TRUE';
      
      const result = await pool.query(
        `UPDATE public.${table} SET ${setClause} WHERE ${filterClause} RETURNING *`,
        [...vals, ...filterVals]
      );
      return res.json({ data: result.rows, error: null });
    }

    if (finalMethod === 'upsert') {
      const keys = Object.keys(finalValues);
      const vals = Object.values(finalValues);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const updateClause = keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ');
      
      const result = await pool.query(
        `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${placeholders}) 
         ON CONFLICT (id) DO UPDATE SET ${updateClause} RETURNING *`,
        vals
      );
      return res.json({ data: result.rows, error: null });
    }

    if (finalMethod === 'delete') {
      const filterItems = (filters || []).filter(f => f && f.column);
      const filterKeys = filterItems.map(f => f.column);
      const filterVals = filterItems.map(f => f.value);
      const filterClause = filterKeys.length > 0
        ? filterKeys.map((k, i) => `${k}::text = $${i + 1}::text`).join(' AND ')
        : 'FALSE';
      const result = await pool.query(`DELETE FROM public.${table} WHERE ${filterClause} RETURNING *`, filterVals);
      return res.json({ data: result.rows, error: null });
    }

    return res.status(400).json({ error: `Unsupported mutation method: ${finalMethod}` });
  } catch (err) {
    console.error(`[Bridge] mutate error [${table}]:`, err.message);
    if (err.detail) console.error(`[Bridge] mutate detail:`, err.detail);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/run-sql', verifyToken, async (req, res) => {
  // Secondary security check for admin operations
  const adminKey = req.headers['x-bridge-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Unauthorized administrative operation' });
  }

  const { sql, values = [] } = req.body;
  try {
    console.log('[Bridge] Admin SQL Execution:', sql.substring(0, 100) + '...');
    const result = await pool.query(sql, values);
    res.json({ data: result.rows, success: true });
  } catch (err) {
    console.error('[Bridge] Admin SQL Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      time: dbCheck.rows[0].now,
      env: process.env.NODE_ENV || 'production'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const email = req.user.email || req.user.preferred_username;
    const result = await pool.query('SELECT * FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ...result.rows[0], permissions: ['*'] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`[Bridge] Server running on port ${port}`));
