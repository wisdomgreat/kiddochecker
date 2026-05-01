
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function dumpData() {
  console.log('Fetching profiles as anon...');
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email');

  if (pErr) {
    console.error('Profile Error:', pErr);
  } else {
    console.log('Profiles found:', profiles?.length);
    console.log('Profiles data:', profiles);
  }

  console.log('Fetching user roles as anon...');
  const { data: roles, error: rErr } = await supabase
    .from('user_roles')
    .select('*');

  if (rErr) {
    console.error('Roles Error:', rErr);
  } else {
    console.log('Roles found:', roles?.length);
    console.log('Roles data:', roles);
  }
}

dumpData();
