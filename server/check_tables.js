const { Pool } = require('pg');
const pool = new Pool({
  host: '10.0.1.4',
  port: 5432,
  user: 'kiddomin',
  password: process.env.DB_PASSWORD || 'Kiddochecker@123!',
  database: 'kiddochecker',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:');
    console.log(rows.map(r => r.table_name).join(', '));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
