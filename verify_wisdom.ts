
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkWisdom() {
  const email = 'wisdom_borobobegreat@gmail.com';
  console.log(`Checking user: ${email}`);

  // Since we can't query by email easily in user_roles, we'll try to find the profile first
  // Profiles might have email now based on recent migrations
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .or(`email.eq.${email},first_name.ilike.%wisdom%`);

  if (pError) {
    console.error('Error fetching profile:', pError);
    return;
  }

  console.log('Found profiles:', profiles);

  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const { data: roles, error: rError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', p.id);
      
      if (rError) {
        console.error(`Error fetching roles for ${p.id}:`, rError);
      } else {
        console.log(`Roles for ${p.id}:`, roles);
      }
    }
  }
}

checkWisdom();
