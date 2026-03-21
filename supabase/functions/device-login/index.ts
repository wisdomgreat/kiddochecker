import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, pin, forensics } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Device code is required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { hardwareId, os, browser, fingerprint, ip } = forensics || {};

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Verify Device Code
    console.log(`[Device Login] Verifying code: ${code}`);
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('enrolled_devices')
      .select('*')
      .eq('enrollment_code', code)
      .eq('status', 'active')
      .single();

    if (deviceError || !device) {
      console.error(`[Device Login Error] Code: ${code}, Error:`, deviceError, 'Device:', device);
      return new Response(JSON.stringify({ error: 'Invalid or inactive device code' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── SECURITY CHECK ──────────────────
    if (device.security_status === 'locked' || (device.locked_until && new Date(device.locked_until) > new Date())) {
      return new Response(JSON.stringify({ error: 'This terminal has been temporarily locked for security reasons.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── STRICT ENFORCEMENT ──────────────────
    const clientIp = ip || req.headers.get('x-forwarded-for') || 'unknown';

    // If the device already has a hardware_id, the current hardwareId must match.
    if (device.hardware_id && hardwareId && device.hardware_id !== hardwareId) {
      console.warn(`[Security Alert] Hardware mismatch for code ${code}. Stored: ${device.hardware_id}, Received: ${hardwareId}`);

      // Log Security Violation
      await supabaseAdmin.rpc('log_device_security_event', {
        p_device_id: device.id,
        p_action: 'security_alert',
        p_metadata: {
          reason: 'Hardware ID mismatch',
          attempted_hardware: hardwareId,
          client_ip: clientIp,
          forensics: forensics
        },
        p_is_failure: true
      });

      return new Response(JSON.stringify({
        error: 'Security Alert: This code is registered to another physical unit. An incident report has been logged.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If it doesn't have a hardware_id yet, lock it now (First Login)
    if (!device.hardware_id && hardwareId) {
      console.log(`[Device Login] Initial lock for code ${code} to hardware ${hardwareId}`);
      await supabaseAdmin
        .from('enrolled_devices')
        .update({
          hardware_id: hardwareId,
          os_info: os,
          browser_info: browser,
          device_fingerprint: fingerprint,
          last_ip: clientIp,
          last_seen: new Date().toISOString(),
          security_status: 'secure'
        })
        .eq('id', device.id);

      // Log successful initial activation
      await supabaseAdmin.rpc('log_device_security_event', {
        p_device_id: device.id,
        p_action: 'terminal_activated',
        p_metadata: { ip: clientIp, os: os, browser: browser }
      });
    } else {
      // Just update last seen
      await supabaseAdmin
        .from('enrolled_devices')
        .update({
          last_ip: clientIp,
          last_seen: new Date().toISOString()
        })
        .eq('id', device.id);
    }

    console.log(`[Device Login] Device authorized:`, device.id, device.name);

    // 2. Verify PIN Security Settings
    const { data: requirePinSetting } = await supabaseAdmin
      .from('kiosk_settings')
      .select('setting_value')
      .eq('setting_key', 'require_pin')
      .maybeSingle();

    const requirePin = requirePinSetting?.setting_value === 'true';

    if (requirePin) {
      if (!pin) {
        return new Response(JSON.stringify({ error: 'Master PIN required' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: pinSetting } = await supabaseAdmin
        .from('kiosk_settings')
        .select('setting_value')
        .eq('setting_key', 'kiosk_pin')
        .maybeSingle();

      if (pinSetting?.setting_value !== pin) {
        return new Response(JSON.stringify({ error: 'Invalid Master PIN' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Generate hidden Supabase user credentials for this device
    const deviceEmail = `device_${device.id}@kiosk.kiddochecker.com`;

    // Generate secure random password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const devicePassword = Array.from(array, (byte) => chars[byte % chars.length]).join('');

    // Try to login if it exists, or create if it doesn't
    const { data: searchUser } = await supabaseAdmin.auth.admin.listUsers();
    let authUser = searchUser.users.find((u: any) => u.email === deviceEmail);

    if (authUser) {
      // Update existing device user's password
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: devicePassword
      });
    } else {
      // Create new device user
      const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: deviceEmail,
        password: devicePassword,
        email_confirm: true,
        user_metadata: {
          first_name: device.name,
          last_name: '(Kiosk)',
          is_device: true,
          device_id: device.id,
          hardware_id: hardwareId,
          role: 'kiosk'
        }
      });

      if (createError) throw createError;
      authUser = newAuthData.user;

      if (!authUser) throw new Error("User creation succeeded but returned null");

      // Create profile
      await supabaseAdmin.from('profiles').upsert({
        id: authUser.id,
        first_name: device.name,
        last_name: '(Kiosk)',
      });

      // Assign 'kiosk' role securely using service key explicitly by updating the trigger-created row
      await supabaseAdmin.from('user_roles').update({
        role: 'kiosk',
        verification_status: 'verified'
      }).eq('user_id', authUser.id);
    }

    // Return the email & password to frontend to sign in
    return new Response(JSON.stringify({
      success: true,
      email: deviceEmail,
      password: devicePassword,
      device: {
        id: device.id,
        name: device.name,
        type: device.type
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Device Login Error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
