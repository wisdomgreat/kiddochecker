// check_reset_tokens.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: '10.0.1.4',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'kiddomin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'kiddochecker',
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const res = await pool.query(`
      SELECT email, token, created_at, expires_at
      FROM public.password_reset_tokens
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    console.log('Recent password reset tokens:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error querying tokens:', err.message);
  } finally {
    await pool.end();
  }
})();
