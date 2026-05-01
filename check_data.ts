
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkData() {
  console.log('Fetching children as anon...');
  const { data, error, count } = await supabase
    .from('children')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Count:', count);
    console.log('Data sample:', data?.slice(0, 2));
  }

  console.log('Fetching attendance as anon...');
  const { data: att, error: aErr, count: aCount } = await supabase
    .from('attendance')
    .select('*', { count: 'exact' });

  if (aErr) {
    console.error('Error:', aErr);
  } else {
    console.log('Attendance Count:', aCount);
  }
}

checkData();
