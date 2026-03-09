import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkPolicies() {
  console.log('Fetching policies for profiles table...');
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles';"
  });

  if (error) {
    console.error('Error fetching policies:', error);
  } else {
    console.log('Policies:', JSON.stringify(data, null, 2));
  }
}

checkPolicies();
