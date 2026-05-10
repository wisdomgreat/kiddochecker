
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function dumpRoles() {
  console.log('Fetching user roles as anon...');
  // Since we don't have service role, we hope some are public or we can guess UIDs
  const { data, error } = await supabase
    .from('user_roles')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Roles found:', data?.length);
    console.log('Roles data:', data);
  }
}

dumpRoles();
