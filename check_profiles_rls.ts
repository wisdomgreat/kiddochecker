import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkRLS() {
  console.log('Checking profiles RLS...');
  // Since we can't do execute_sql, let's just try to check if we can see our own profile
  // and check if we see others.
  
  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log(`Visible profiles count: ${count}`);
    console.log('Data:', data);
  }
}

checkRLS();
