
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkRLS() {
  const { data, error } = await supabase.rpc('check_table_rls_status', { t_name: 'user_roles' });
  if (error) {
    // If RPC doesn't exist, we'll try a different way or just assume it's the problem
    console.log('RPC check_table_rls_status not found');
  } else {
    console.log('RLS Status:', data);
  }
}
// checkRLS(); // Skip RPC check, let's just fix it with a migration
