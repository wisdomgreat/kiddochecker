import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkChildren() {
  console.log('Fetching kids for some parent ID...');
  // I'll use a hardcoded parent ID if I know one, or just try to select *
  const { data, error, count } = await supabase
    .from('children')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching children:', error);
  } else {
    console.log(`Visible children count: ${count}`);
    console.log('Data:', data);
  }
}

checkChildren();
