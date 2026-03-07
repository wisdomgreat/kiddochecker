import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  const { data, error } = await supabase.rpc('get_users_with_roles');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Users and Roles:', JSON.stringify(data, null, 2));
}

checkUsers();
