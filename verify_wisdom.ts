import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function verify() {
  const emails = ['wisdom_borntobegreat@yahoo.com', 'wisdom.borntobegreat@yahoo.com'];
  
  for (const email of emails) {
    console.log(`Checking ${email}...`);
    const { data, error } = await supabase.rpc('debug_user_info_v2', { p_email: email });
    if (error) {
      console.error(`Error checking ${email}:`, error);
    } else {
      console.log(`Result for ${email}:`, data);
    }
  }
}

verify();
