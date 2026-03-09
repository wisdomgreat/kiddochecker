import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function checkTrigger() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user';"
  });
  console.log(error || data);
}
checkTrigger();
