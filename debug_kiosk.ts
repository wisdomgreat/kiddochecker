import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

async function inspectKioskLogin() {
  const searchVal = 'Wisdom'; // Or whatever search term you're using in the kiosk
  console.log(`Searching for Parent: ${searchVal}...`);
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, security_pin, email')
    .or(`phone.ilike.%${searchVal}%,first_name.ilike.%${searchVal}%,last_name.ilike.%${searchVal}%`);

  if (error) {
    console.error('Error searching profiles:', error);
  } else {
    console.log('Found Profiles:', JSON.stringify(profiles, null, 2));
    
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        console.log(`Checking children for ${profile.first_name}...`);
        const { data: kids, error: kidsError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', profile.id);
        
        if (kidsError) console.error(`Error fetching kids for ${profile.id}:`, kidsError);
        else console.log(`Kids for ${profile.first_name}:`, JSON.stringify(kids, null, 2));
      }
    }
  }
}

inspectKioskLogin();
