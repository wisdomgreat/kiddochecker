import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkProfilesTable() {
  console.log('Fetching one profile to see columns...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log('Sample data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    }
  }
}

checkProfilesTable();
