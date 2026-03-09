import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_roles';"
  });
  
  if (error) {
    // try fallback 
    const { data: qData, error: qError } = await supabase.from('user_roles').select('*').limit(1);
    console.log(qError || qData);
  } else {
    console.log('Columns:', data);
  }
}

checkSchema();
