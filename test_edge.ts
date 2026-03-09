import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

async function testEdgeFuncLogic() {
  const email = `teststaff${Date.now()}@example.com`;
  
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'Staff',
      phone: null
    }
  });

  if (authError) {
    console.error('Auth User Creation Error:', authError);
    return;
  }
  
  console.log('User Created. ID:', authData.user.id);
  
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      first_name: 'Test',
      last_name: 'Staff',
      phone: null
    });
    
  if (profileError) console.error('Profile Error:', profileError);

  const { error: roleError, data: roleData } = await supabase
    .from('user_roles')
    .upsert({
      user_id: authData.user.id,
      role: 'staff',
      is_super_admin: false,
      is_volunteer: false,
      verification_status: 'verified'
    }, {
      onConflict: 'user_id'
    }).select();

  if (roleError) {
    console.error('Role Upsert Error:', roleError);
  } else {
    console.log('Role Upsert Success!', roleData);
  }
}

testEdgeFuncLogic();
