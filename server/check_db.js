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
    // Check if profiles exist
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM public.profiles');
    console.log('Profiles count:', countRows[0].count);
    const { rows: emailRows } = await pool.query('SELECT email FROM public.profiles');
    console.log('Emails:', emailRows.map(r => r.email).join(', '));
    
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
