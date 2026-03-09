import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';"
  });
  
  if (error) {
    // try fallback 
    const { data: qData, error: qError } = await supabase.from('profiles').select('*').limit(1);
    console.log(qError || qData);
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();
