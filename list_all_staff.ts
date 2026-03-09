import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function listStaff() {
  console.log('Fetching all staff members...');
  const { data, error } = await supabase.rpc('get_staff_members');
  
  if (error) {
    console.error('Error fetching staff:', error);
  } else {
    console.log('Staff list:');
    (data as any[]).forEach(s => {
      console.log(`- ${s.email} [${s.role}] (Status: ${s.verification_status})`);
    });
  }
}

listStaff();
