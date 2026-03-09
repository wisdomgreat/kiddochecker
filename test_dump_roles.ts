import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function dumpRoles() {
  const { data, error } = await supabase.rpc('get_all_user_roles');
  
  if (error) {
    console.error('Error fetching roles:', error);
  } else {
    console.log('All user_roles in database:');
    console.log(JSON.stringify(data, null, 2));
  }
}

dumpRoles();
