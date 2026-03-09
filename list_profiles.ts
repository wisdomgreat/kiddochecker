import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function listRecentProfiles() {
  console.log('Fetching recent profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Recent Profiles:');
    (data as any[]).forEach(p => {
      console.log(`- ${p.first_name} ${p.last_name} (${p.phone || 'no phone'}) [${p.created_at}]`);
    });
  }
}

listRecentProfiles();
