import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkPolicies() {
  const { data: policiesData, error: policiesError } = await supabase.rpc('get_table_policies_json', { p_tablename: 'user_roles' });
  
  if (policiesError) {
    console.error('Error fetching policies:', policiesError);
  } else {
    console.log('Active policies on user_roles:');
    console.log(JSON.stringify(policiesData, null, 2));
  }
}

checkPolicies();
