import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'user_roles';"
  });
  
  if (error) {
    // try direct query if execute_sql is dropped or not available
    console.error('RPC Error, trying alternative...', error);
    // we can't reliably do arbitrary SQL without a function. 
    // Let's just create a quick migration or function to get them.
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkPolicies();
