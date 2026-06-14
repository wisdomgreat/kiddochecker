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
      const { rows: churchRows } = await pool.query('SELECT id, name, domain FROM public.churches');
      console.log('Churches:', JSON.stringify(churchRows));
    } catch (e) {
      console.error('Error fetching churches:', e.message);
    }

    try {
      const { rows: churches } = await pool.query('SELECT id, name FROM public.churches');
      for (const church of churches) {
        console.log(`=== Testing for Church ID: ${church.id} (${church.name}) ===`);
        // We set the church_id on the connection client to test RLS
        const client = await pool.connect();
        try {
          await client.query('SET app.church_id = $1', [church.id]);
          const { rows: settings } = await client.query('SELECT * FROM public.communication_settings');
          console.log('Settings:', JSON.stringify(settings));
        } finally {
          client.release();
        }
      }
    } catch (e) {
      console.error('Error testing tenant settings:', e.message);
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
