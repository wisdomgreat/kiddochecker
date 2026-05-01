
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function testQuery() {
  const userId = '00000000-0000-0000-0000-000000000000'; // Dummy ID
  
  console.log('Testing role query...');
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      custom_roles (
        role_permissions (
          permissions (name)
        )
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Role Query Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Role Query Success');
  }

  console.log('Testing security groups query...');
  const { data: gData, error: gError } = await supabase
    .from('user_security_groups')
    .select(`
      security_groups (
        group_permissions (
          permissions (name)
        )
      )
    `)
    .eq('user_id', userId);

  if (gError) {
    console.error('Groups Query Error:', JSON.stringify(gError, null, 2));
  } else {
    console.log('Groups Query Success');
  }
}

testQuery();
