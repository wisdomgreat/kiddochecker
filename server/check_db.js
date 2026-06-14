const { Pool } = require('pg');
const pool = new Pool({
  host: '10.0.1.4',
  port: 5432,
  user: 'kiddomin',
  password: process.env.DB_PASSWORD || 'Kiddochecker@123!', // Using common fallback or env if available
  database: 'kiddochecker',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM public.profiles');
    console.log('Profiles count:', countRows[0].count);
    const { rows: emailRows } = await pool.query('SELECT email FROM public.profiles');
    console.log('Emails:', emailRows.map(r => r.email).join(', '));

    try {
      const { rows: settingsRows } = await pool.query('SELECT resend_api_key, resend_domain FROM public.communication_settings LIMIT 1');
      if (settingsRows.length > 0) {
        console.log('Resend Config:', {
          hasKey: !!settingsRows[0].resend_api_key,
          keyLength: settingsRows[0].resend_api_key ? settingsRows[0].resend_api_key.length : 0,
          keyPrefix: settingsRows[0].resend_api_key ? settingsRows[0].resend_api_key.substring(0, 7) : 'none',
          domain: settingsRows[0].resend_domain
        });
      } else {
        console.log('No rows in communication_settings');
      }
    } catch (e) {
      console.error('Error fetching communication_settings:', e.message);
    }
    
    // Add default uuid to id
    await pool.query('ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid()');
    console.log('Altered profiles id to default gen_random_uuid()');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
