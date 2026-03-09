import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function findParent() {
  const phone = '7782560796';
  console.log(`Searching for Parent with phone ${phone}...`);
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, security_pin')
    .eq('phone', phone);

  if (error) {
    console.error('Error searching profiles:', error);
  } else {
    console.log('Found Profiles:', JSON.stringify(profiles, null, 2));
  }
}

findParent();
