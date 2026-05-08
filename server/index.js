const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// ─── Database Connection ──────────────────────────────────────────────────
const pool = new Pool({
  host: '10.0.1.4',
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
  console.log('[DB] Initializing schema verification...');
  console.log('[DB] Attempting to verify schema...');
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
}

setupDatabase();

app.use(cors({
  origin: ['https://happy-glacier-0746a2210.7.azurestaticapps.net', 'https://kiddochecker.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Bridge-Secret'],
  credentials: true
}));
app.use(express.json());

// ─── Email & SMS Helpers ─────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const data = await resend.emails.send({
      from: 'KiddoChecker <noreply@kiddochecker.com>',
      to: [to],
      subject: subject,
      html: html,
    });
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
    { name: 'pgcrypto', sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' },
    { name: 'report_seals', sql: `CREATE TABLE IF NOT EXISTS public.report_seals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), report_type TEXT, generated_at TIMESTAMPTZ DEFAULT now(), generated_by_profile UUID, seal_hash TEXT, metadata JSONB);` },
    { name: 'message_read_receipts', sql: `CREATE TABLE IF NOT EXISTS public.message_read_receipts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message_id UUID REFERENCES public.messages(id), user_id UUID REFERENCES public.profiles(id), read_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now());` },
    { name: 'col_qr_token', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS qr_token TEXT;' },
    { name: 'col_device_id', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_id TEXT;' },
    { name: 'col_health_fever', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS health_fever BOOLEAN DEFAULT false;' },
    { name: 'col_health_cough', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS health_cough BOOLEAN DEFAULT false;' },
    { name: 'col_device_metadata', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS device_metadata JSONB DEFAULT \'{}\'::jsonb;' },
    { name: 'col_status', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'present\';' },
    { name: 'col_checked_in_method', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_in_method TEXT;' },
    { name: 'col_checked_out_method', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_out_method TEXT;' },
    { name: 'col_checked_in_station', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_in_station TEXT;' },
    { name: 'col_checked_out_station', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS checked_out_station TEXT;' },
    { name: 'col_signature_data', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS signature_data TEXT;' },
    { name: 'col_override_reason', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS override_reason TEXT;' },
    { name: 'col_pickup_snapshot', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS pickup_snapshot JSONB DEFAULT \'{}\'::jsonb;' },
    { name: 'col_witness_id', sql: 'ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS witness_id UUID;' },
    { name: 'app_role_type', sql: `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN CREATE TYPE app_role AS ENUM ('admin', 'super_admin', 'staff', 'teacher', 'teacher_assistant', 'volunteer', 'parent', 'kiosk'); END IF; END $$;` },
    { name: 'checkin_child', sql: `CREATE OR REPLACE FUNCTION public.checkin_child(p_child_id UUID, p_class_id UUID DEFAULT NULL, p_checked_in_by UUID DEFAULT NULL, p_qr_token TEXT DEFAULT NULL, p_method TEXT DEFAULT 'app_dashboard', p_station TEXT DEFAULT NULL, p_special_instructions TEXT DEFAULT NULL, p_health_fever BOOLEAN DEFAULT false, p_health_cough BOOLEAN DEFAULT false, p_device_metadata JSONB DEFAULT '{}'::jsonb, p_device_id TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL) RETURNS UUID AS $$ DECLARE v_attendance_id UUID; BEGIN INSERT INTO public.attendance (child_id, class_id, checked_in_by, qr_token, checked_in_method, checked_in_station, special_instructions, health_fever, health_cough, device_metadata, device_id, checked_in_at, attendance_date, status) VALUES (p_child_id, p_class_id, COALESCE(p_checked_in_by, p_user_id), p_qr_token, p_method, p_station, p_special_instructions, p_health_fever, p_health_cough, p_device_metadata, p_device_id, now(), CURRENT_DATE, 'present') RETURNING id INTO v_attendance_id; RETURN v_attendance_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'checkout_child', sql: `CREATE OR REPLACE FUNCTION public.checkout_child(p_attendance_id UUID, p_checked_out_by UUID DEFAULT NULL, p_qr_token TEXT DEFAULT NULL, p_method TEXT DEFAULT 'app_dashboard', p_station TEXT DEFAULT NULL, p_signature_data TEXT DEFAULT NULL, p_override_reason TEXT DEFAULT NULL, p_pickup_snapshot JSONB DEFAULT '{}'::jsonb, p_device_metadata JSONB DEFAULT '{}'::jsonb, p_witness_id UUID DEFAULT NULL, p_device_id TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL) RETURNS VOID AS $$ BEGIN UPDATE public.attendance SET checked_out_at = now(), checked_out_by = COALESCE(p_checked_out_by, p_user_id), checked_out_method = p_method, checked_out_station = p_station, signature_data = p_signature_data, override_reason = p_override_reason, pickup_snapshot = p_pickup_snapshot, device_metadata = p_device_metadata, witness_id = p_witness_id, device_id = p_device_id, status = 'checked_out' WHERE id = p_attendance_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'youth_self_check_action', sql: `CREATE OR REPLACE FUNCTION public.youth_self_check_action(p_pin_code TEXT, p_kiosk_id TEXT) RETURNS JSONB AS $$ DECLARE v_child_id UUID; v_child_name TEXT; BEGIN SELECT id, first_name || ' ' || last_name INTO v_child_id, v_child_name FROM public.children WHERE youth_pin = p_pin_code LIMIT 1; IF v_child_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN'); END IF; RETURN jsonb_build_object('success', true, 'child_id', v_child_id, 'child_name', v_child_name); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_parent_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_parent_for_kiosk(p_search_val TEXT, p_pin TEXT) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, phone TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, p.phone FROM public.profiles p WHERE (regexp_replace(p.phone, '\\D', '', 'g') ILIKE '%' || regexp_replace(p_search_val, '\\D', '', 'g') || '%' OR p.first_name ILIKE '%' || p_search_val || '%' OR p.last_name ILIKE '%' || p_search_val || '%') AND p.security_pin = p_pin LIMIT 5; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_children_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_children_for_kiosk(p_parent_id UUID, p_pin TEXT) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, age INTEGER, class_id UUID) AS $$ BEGIN RETURN QUERY SELECT c.id, c.first_name, c.last_name, c.age, c.class_id FROM public.children c JOIN public.profiles p ON c.parent_id = p.id WHERE p.id = p_parent_id AND p.security_pin = p_pin; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'verify_staff_pin_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.verify_staff_pin_for_kiosk(p_pin TEXT) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, role TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, ur.role::TEXT FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE (p.staff_pin = p_pin OR p.security_pin = p_pin) AND ur.role IN ('admin', 'super_admin', 'staff', 'teacher') LIMIT 1; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_terminal_security_stats', sql: `CREATE OR REPLACE FUNCTION public.get_terminal_security_stats() RETURNS TABLE (active_kiosks bigint, authorized_devices bigint, active_staff_sessions bigint, security_alerts_24h bigint) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.devices WHERE type = 'kiosk' AND is_active = true) as active_kiosks, (SELECT COUNT(*) FROM public.devices WHERE is_authorized = true) as authorized_devices, (SELECT COUNT(*) FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE ur.role IN ('staff', 'admin', 'super_admin')) as active_staff_sessions, 0::bigint as security_alerts_24h; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_stats', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_stats() RETURNS TABLE (total_checkins bigint, total_on_site bigint, total_departed bigint, total_late_pickups bigint) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE) as total_checkins, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at IS NULL) as total_on_site, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at IS NOT NULL) as total_departed, (SELECT COUNT(*) FROM public.attendance WHERE attendance_date = CURRENT_DATE AND checked_out_at > (attendance_date + time '18:00')) as total_late_pickups; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_summary_secure', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_summary_secure(p_date date DEFAULT CURRENT_DATE) RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_children bigint, checked_in_count bigint, checked_out_count bigint, currently_present bigint) AS $$ BEGIN RETURN QUERY SELECT a.attendance_date, c.id as class_id, c.name as class_name, COUNT(DISTINCT a.child_id) as total_children, COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL THEN a.child_id END) as checked_in_count, COUNT(DISTINCT CASE WHEN a.checked_out_at IS NOT NULL THEN a.child_id END) as checked_out_count, COUNT(DISTINCT CASE WHEN a.checked_in_at IS NOT NULL AND a.checked_out_at IS NULL THEN a.child_id END) as currently_present FROM public.attendance a LEFT JOIN public.classes c ON a.class_id = c.id WHERE a.attendance_date = p_date GROUP BY a.attendance_date, c.id, c.name; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_attendance_report', sql: `CREATE OR REPLACE FUNCTION public.get_attendance_report(start_date date, end_date date) RETURNS TABLE (attendance_date date, class_id uuid, class_name text, total_checked_in bigint, total_checked_out bigint) AS $$ BEGIN RETURN QUERY SELECT a.attendance_date, c.id as class_id, COALESCE(c.name, 'Unassigned') as class_name, COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_in_at IS NOT NULL) as total_checked_in, COUNT(DISTINCT a.child_id) FILTER (WHERE a.checked_out_at IS NOT NULL) as total_checked_out FROM public.attendance a LEFT JOIN public.classes c ON a.class_id = c.id WHERE a.attendance_date BETWEEN start_date AND end_date GROUP BY a.attendance_date, c.id, c.name; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_liability_audit_report', sql: `CREATE OR REPLACE FUNCTION public.get_liability_audit_report(start_date date, end_date date) RETURNS TABLE (attendance_id UUID, attendance_date DATE, child_name TEXT, child_age INTEGER, has_allergies BOOLEAN, class_name TEXT, checked_in_at TIMESTAMPTZ, checked_in_by_name TEXT, checked_in_by_role TEXT, checked_in_method TEXT, checked_in_station TEXT, checked_out_at TIMESTAMPTZ, checked_out_by_name TEXT, checked_out_by_role TEXT, checked_out_method TEXT, checked_out_station TEXT, duration_hours NUMERIC, health_fever BOOLEAN, health_cough BOOLEAN, special_instructions TEXT, device_ua TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT a.id as attendance_id, a.attendance_date, CONCAT(ch.first_name, ' ', ch.last_name) as child_name, ch.age as child_age, (ch.allergies IS NOT NULL AND ch.allergies <> '') as has_allergies, COALESCE(cl.name, 'Unassigned') as class_name, a.checked_in_at, COALESCE(CONCAT(p_in.first_name, ' ', p_in.last_name), 'System/PIN') as checked_in_by_name, COALESCE(ur_in.role::text, 'parent') as checked_in_by_role, a.checked_in_method, a.checked_in_station, a.checked_out_at, COALESCE(CONCAT(p_out.first_name, ' ', p_out.last_name), 'N/A') as checked_out_by_name, COALESCE(ur_out.role::text, 'parent') as checked_out_by_role, a.checked_out_method, a.checked_out_station, CASE WHEN a.checked_out_at IS NOT NULL THEN EXTRACT(EPOCH FROM (a.checked_out_at - a.checked_in_at)) / 3600.0 ELSE NULL END as duration_hours, a.health_fever, a.health_cough, a.special_instructions, a.device_metadata->>'userAgent' as device_ua FROM public.attendance a JOIN public.children ch ON a.child_id = ch.id LEFT JOIN public.classes cl ON a.class_id = cl.id LEFT JOIN public.profiles p_in ON a.checked_in_by = p_in.id LEFT JOIN public.profiles p_out ON a.checked_out_by = p_out.id LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_in_by LIMIT 1) ur_in ON TRUE LEFT JOIN LATERAL (SELECT role FROM user_roles WHERE user_id = a.checked_out_by LIMIT 1) ur_out ON TRUE WHERE a.attendance_date BETWEEN start_date AND end_date ORDER BY a.attendance_date DESC, a.checked_in_at DESC; END; $$;` },
    { name: 'get_users_with_roles', sql: `DROP FUNCTION IF EXISTS public.get_users_with_roles(); CREATE OR REPLACE FUNCTION public.get_users_with_roles() RETURNS TABLE (id UUID, email TEXT, first_name TEXT, last_name TEXT, role TEXT, created_at TIMESTAMPTZ) AS $$ BEGIN RETURN QUERY SELECT p.id, p.email, p.first_name, p.last_name, ur.role::TEXT, p.created_at FROM public.profiles p LEFT JOIN public.user_roles ur ON p.id = ur.user_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_current_user_role', sql: `CREATE OR REPLACE FUNCTION public.get_current_user_role(p_user_id UUID DEFAULT NULL) RETURNS TEXT AS $$ DECLARE v_role TEXT; BEGIN SELECT role::TEXT INTO v_role FROM public.user_roles WHERE user_id = p_user_id LIMIT 1; RETURN COALESCE(v_role, 'parent'); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_available_recipients', sql: `CREATE OR REPLACE FUNCTION public.get_available_recipients(p_user_id UUID) RETURNS TABLE (id UUID, first_name TEXT, last_name TEXT, role TEXT) AS $$ BEGIN RETURN QUERY SELECT p.id, p.first_name, p.last_name, ur.role::TEXT FROM public.profiles p JOIN public.user_roles ur ON p.id = ur.user_id WHERE p.id != p_user_id; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_parent_children_with_classes', sql: `CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id UUID DEFAULT NULL, p_user_id UUID DEFAULT NULL) RETURNS TABLE (child_id UUID, first_name TEXT, last_name TEXT, age INTEGER, allergies TEXT, medical_info TEXT, emergency_contact_name TEXT, emergency_contact_phone TEXT, notes TEXT, current_class_name TEXT) AS $$ BEGIN RETURN QUERY SELECT c.id, c.first_name, c.last_name, c.age, c.allergies, c.medical_info, c.emergency_contact_name, c.emergency_contact_phone, c.notes, cl.name as current_class_name FROM public.children c LEFT JOIN public.classes cl ON c.class_id = cl.id WHERE c.parent_id = COALESCE(parent_user_id, p_user_id); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_church_stats', sql: `CREATE OR REPLACE FUNCTION public.get_church_stats(p_user_id UUID DEFAULT NULL) RETURNS JSONB AS $$ BEGIN RETURN jsonb_build_object('total_members', (SELECT COUNT(*) FROM public.profiles), 'active_volunteers', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'volunteer'), 'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE event_date >= CURRENT_DATE)); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'get_staff_shifts_for_kiosk', sql: `CREATE OR REPLACE FUNCTION public.get_staff_shifts_for_kiosk() RETURNS TABLE (id UUID, staff_id UUID, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ) AS $$ BEGIN RETURN QUERY SELECT s.id, s.staff_id, s.start_time, s.end_time FROM public.staff_shifts s WHERE s.start_time::date = CURRENT_DATE; END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'check_user_permission', sql: `CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission_name TEXT) RETURNS BOOLEAN AS $$ DECLARE v_is_admin BOOLEAN; BEGIN SELECT (role IN ('admin', 'super_admin') OR is_super_admin = true) INTO v_is_admin FROM public.user_roles WHERE user_id = p_user_id; IF v_is_admin THEN RETURN TRUE; END IF; RETURN EXISTS (SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON rp.permission_id = p.id JOIN public.user_roles ur ON ur.role::text = rp.role_id::text WHERE ur.user_id = p_user_id AND p.name = p_permission_name); END; $$ LANGUAGE plpgsql SECURITY DEFINER;` },
    { name: 'device_mgmt', sql: `CREATE OR REPLACE FUNCTION public.register_device(p_device_id TEXT, p_name TEXT, p_type TEXT, p_location TEXT DEFAULT NULL) RETURNS VOID AS $$ BEGIN INSERT INTO public.devices (device_id, name, type, location, is_active, is_authorized) VALUES (p_device_id, p_name, p_type, p_location, true, true) ON CONFLICT (device_id) DO UPDATE SET name = p_name, type = p_type, location = p_location, last_seen_at = now(); END; $$ LANGUAGE plpgsql; CREATE OR REPLACE FUNCTION public.get_device_profile(p_device_id TEXT) RETURNS JSONB AS $$ DECLARE v_dev RECORD; BEGIN SELECT * INTO v_dev FROM public.devices WHERE device_id = p_device_id AND is_active = true LIMIT 1; IF v_dev IS NULL THEN RETURN NULL; END IF; RETURN jsonb_build_object('id', v_dev.id, 'name', v_dev.name, 'type', v_dev.type, 'is_authorized', v_dev.is_authorized); END; $$ LANGUAGE plpgsql;` }

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
  } catch (err) { console.error('[Bridge] Post-migration error:', err.message); }
}

(async () => {
  try {

  } catch (err) { console.error('[PROBE] Master Key error:', err.message); }
  await runMigrations();
})();

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
  try {
    req.user = jwt.verify(token, BRIDGE_SECRET);
    return next();
  } catch (e) {
    jwt.verify(token, getKey, { audience: 'e48264b2-de12-4444-a290-a8d7f3e3a525', issuer: 'https://kiddochecker.ciamlogin.com/08e0221b-0776-4500-8e5f-c6002cf868bc/v2.0' }, (err, decoded) => {
      if (err) return res.status(403).send('Invalid Token');
      req.user = decoded;
      next();
    });
  }
};

// ─── API Routes ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.send('Online'));

app.post(['/api/auth/send-code', '/auth/send-code'], async (req, res) => {
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

app.post(['/api/auth/verify-code', '/auth/verify-code'], async (req, res) => {
  const { email, code } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM auth.verification_codes WHERE email = $1 AND code = $2 AND expires_at > NOW()',
      [email, code]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired code' });
    
    // Issue Bridge JWT
    const token = jwt.sign({ email, role: 'admin' }, BRIDGE_SECRET, { expiresIn: '24h' });
    
    // Fetch profile to return along with token (Fixes frontend hang)
    const profileRes = await pool.query('SELECT * FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
    const profile = profileRes.rows[0] || { email, role: 'admin' };
    
    res.json({ token, profile });
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
    
    if (!finalFn) {
      return res.status(400).json({ error: 'No RPC name specified' });
    }

    // Inject user ID if missing
    if (!finalParams.p_user_id && req.user) {
      const email = req.user.email || req.user.preferred_username;
      const userRes = await pool.query('SELECT id FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
      if (userRes.rows.length > 0) {
        finalParams.p_user_id = userRes.rows[0].id;
      }
    }

    let result;
    if (Array.isArray(finalParams)) {
      const placeholders = finalParams.map((_, i) => `$${i + 1}`).join(', ');
      result = await pool.query(`SELECT * FROM public.${finalFn}(${placeholders})`, finalParams);
    } else {
      const keys = Object.keys(finalParams);
      const vals = Object.values(finalParams);
      
      // Build placeholders with explicit casting to solve the "function does not exist" type ambiguity
      const placeholders = keys.map((k, i) => {
        const val = vals[i];
        if (k.endsWith('_id') || k === 'p_attendance_id') return `${k} => $${i + 1}::uuid`;
        if (k.endsWith('_metadata') || k.endsWith('_snapshot')) {
          // Ensure JSON objects are stringified for pg driver
          if (val && typeof val === 'object') vals[i] = JSON.stringify(val);
          return `${k} => $${i + 1}::jsonb`;
        }
        if (k.startsWith('p_health_')) return `${k} => $${i + 1}::boolean`;
        return `${k} => $${i + 1}`;
      }).join(', ');
      
      result = await pool.query(`SELECT * FROM public.${finalFn}(${placeholders})`, vals);
    }

    let data = result.rows;
    // If it returns a single column named after the function, it's a single value result
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
  let sql = "";
  try {
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
      const cleanSelect = select.replace(/[\w]+:[\w]+\([^)]+\)/g, '').replace(/,(\s*,)+/g, ',').replace(/^,|,$/g, '');
      sql = `SELECT ${cleanSelect === '*' || cleanSelect === '' ? '*' : cleanSelect} FROM public.${table} t`;
    }

    const values = [];
    if (actualFilters && actualFilters.length > 0) {
      const clauses = actualFilters.map(f => {
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
    console.error(`[Bridge] query error [${table}]:`, err.message, '| SQL:', sql);
    res.status(500).json({ error: err.message }); 
  }
});



app.post('/api/mutate', verifyToken, async (req, res) => {
  console.log('[Bridge] Mutation Request:', JSON.stringify(req.body, null, 2));
  let { table, method, action, values, data, filters } = req.body;
  
  // Normalize fields between Supabase proxy and internal calls
  const finalMethod = method || action || req.body.method || req.body.action;
  const finalValues = values || data || req.body.values || req.body.data;

  try {
    if (!finalMethod) {
      console.error('[Bridge] Mutation error: No method/action specified in body');
      return res.status(400).json({ error: 'Unsupported mutation method: undefined' });
    }
    
    if (finalMethod === 'insert' || finalMethod === 'upsert') {
      const cols = Object.keys(finalValues).join(', ');
      const placeholders = Object.keys(finalValues).map((_, i) => {
        const key = Object.keys(finalValues)[i];
        if (key.endsWith('_id') || key === 'id') return `$${i + 1}::uuid`;
        return `$${i + 1}`;
      }).join(', ');
      const vals = Object.values(finalValues);
      
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
      const filterKeys = (filters || []).map(f => f.column);
      const filterVals = (filters || []).map(f => f.value);
      const filterClause = filterKeys.map((k, i) => `${k}::text = $${vals.length + i + 1}::text`).join(' AND ');
      
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
      const filterKeys = (filters || []).map(f => f.column);
      const filterVals = (filters || []).map(f => f.value);
      const filterClause = filterKeys.map((k, i) => `${k}::text = $${i + 1}::text`).join(' AND ');
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

app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const email = req.user.email || req.user.preferred_username;
    const result = await pool.query('SELECT * FROM public.profiles WHERE email = $1 LIMIT 1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ...result.rows[0], permissions: ['*'] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => console.log(`[Bridge] Server running on port ${port}`));
