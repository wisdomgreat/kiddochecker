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
    const { code, pin } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Device code is required' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    console.log(`[Device Login] Device found:`, device.id, device.name);

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
          device_id: device.id
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

      // Assign 'kiosk' role securely using service key
      await supabaseAdmin.from('user_roles').upsert({
        user_id: authUser.id,
        role: 'kiosk',
        verification_status: 'verified'
      }, { onConflict: 'user_id' });
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
