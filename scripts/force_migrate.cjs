const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false }
});

async function forceMigrate() {
  console.log('🚀 Starting Force Migration...');
  
  try {
    // 1. Enable Extension
    console.log('[1] Enabling pgcrypto...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // 2. Patch Attendance Table
    console.log('[2] Patching attendance table...');
    const columns = [
      'qr_token TEXT',
      'device_id TEXT',
      'health_fever BOOLEAN DEFAULT false',
      'health_cough BOOLEAN DEFAULT false',
      'device_metadata JSONB DEFAULT \'{}\'::jsonb',
      'method TEXT',
      'station TEXT'
    ];

    for (const col of columns) {
      const colName = col.split(' ')[0];
      try {
        await pool.query(`ALTER TABLE public.attendance ADD COLUMN ${col}`);
        console.log(`   ✅ Added ${colName}`);
      } catch (err) {
        if (err.code === '42701') {
          console.log(`   ℹ️ ${colName} already exists`);
        } else {
          console.error(`   ❌ Failed to add ${colName}:`, err.message);
        }
      }
    }

    // 3. Inject Youth RPC
    console.log('[3] Injecting youth_self_check_action...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.youth_self_check_action(p_pin_code TEXT, p_kiosk_id TEXT)
      RETURNS JSONB AS $$
      DECLARE
        v_child_id UUID;
        v_child_name TEXT;
      BEGIN
        SELECT id, first_name || ' ' || last_name INTO v_child_id, v_child_name
        FROM public.children WHERE youth_pin = p_pin_code LIMIT 1;
        
        IF v_child_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN');
        END IF;
        
        RETURN jsonb_build_object('success', true, 'child_id', v_child_id, 'child_name', v_child_name);
      END; $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('   ✅ Youth RPC injected.');

    // 4. Inject Core Check-in RPCs
    console.log('[4] Injecting checkin/checkout RPCs...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.checkin_child(
        p_child_id UUID,
        p_class_id UUID DEFAULT NULL,
        p_checked_in_by UUID DEFAULT NULL,
        p_qr_token TEXT DEFAULT NULL,
        p_method TEXT DEFAULT 'app_dashboard',
        p_station TEXT DEFAULT NULL,
        p_special_instructions TEXT DEFAULT NULL,
        p_health_fever BOOLEAN DEFAULT false,
        p_health_cough BOOLEAN DEFAULT false,
        p_device_metadata JSONB DEFAULT '{}'::jsonb,
        p_device_id TEXT DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_attendance_id UUID;
      BEGIN
        INSERT INTO public.attendance (
          child_id, class_id, checked_in_by, qr_token, method, station,
          special_instructions, health_fever, health_cough, device_metadata, 
          device_id, checked_in_at, attendance_date
        ) VALUES (
          p_child_id, p_class_id, p_checked_in_by, p_qr_token, p_method, p_station,
          p_special_instructions, p_health_fever, p_health_cough, p_device_metadata,
          p_device_id, now(), CURRENT_DATE
        ) RETURNING id INTO v_attendance_id;
        RETURN v_attendance_id;
      END; $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION public.checkout_child(
        p_attendance_id UUID,
        p_checked_out_by UUID DEFAULT NULL,
        p_qr_token TEXT DEFAULT NULL,
        p_method TEXT DEFAULT 'app_dashboard',
        p_station TEXT DEFAULT NULL,
        p_signature_data TEXT DEFAULT NULL,
        p_override_reason TEXT DEFAULT NULL,
        p_pickup_snapshot JSONB DEFAULT NULL,
        p_device_metadata JSONB DEFAULT '{}'::jsonb,
        p_witness_id UUID DEFAULT NULL,
        p_device_id TEXT DEFAULT NULL
      ) RETURNS VOID AS $$
      BEGIN
        UPDATE public.attendance SET
          checked_out_at = now(),
          checked_out_by = p_checked_out_by::text,
          checked_out_method = p_method,
          checked_out_station = p_station,
          signature_data = p_signature_data,
          override_reason = p_override_reason,
          pickup_snapshot = p_pickup_snapshot::text,
          device_metadata = p_device_metadata,
          witness_id = p_witness_id,
          device_id = p_device_id
        WHERE id = p_attendance_id;
      END; $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('   ✅ Check-in/out RPCs injected.');

    // 5. Verification
    console.log('[5] Verifying schema...');
    const checkCols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'attendance' AND column_name = 'device_metadata'
    `);
    console.log(`   Column device_metadata: ${checkCols.rows.length > 0 ? 'PRESENT' : 'MISSING'}`);

    const checkFn = await pool.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'youth_self_check_action'
    `);
    console.log(`   Function youth_self_check_action: ${checkFn.rows.length > 0 ? 'PRESENT' : 'MISSING'}`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
    console.log('🏁 Force Migration Finished.');
  }
}

forceMigrate();
