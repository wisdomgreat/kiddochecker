import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkCols() {
  const { data, error } = await supabase.rpc('get_table_schema', { p_tablename: 'user_roles' });
  if (error) console.error(error);
  else console.log(data);
}
checkCols();
