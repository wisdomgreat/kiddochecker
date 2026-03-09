import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function countProfiles() {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting profiles:', error);
  } else {
    console.log('Total profiles:', count);
  }

  const { data: profs, error: err2 } = await supabase.from('profiles').select('*').limit(5);
  console.log('Sample profiles:', profs);
}

countProfiles();
