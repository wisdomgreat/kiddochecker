import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkAllAuthUsers() {
  console.log('Fetching all user emails via debug function...');
  // I'll create a temporary function to list emails if I can't do it directly
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT email FROM auth.users;"
  });

  if (error) {
    console.error('Error fetching emails:', error);
    // Fallback: use the staff members RPC which we know works
    const { data: staff, error: staffError } = await supabase.rpc('get_staff_members');
    if (staffError) console.error('Staff RPC error:', staffError);
    else {
      console.log('Users in system (staff):');
      (staff as any[]).forEach(s => console.log(`- ${s.email}`));
    }
  } else {
    console.log('All emails in auth.users:');
    (data as any[]).forEach(u => console.log(`- ${u.email}`));
  }
}

checkAllAuthUsers();
