const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const rpcResult = await pool.query("SELECT * FROM public.get_users_with_roles()");
    console.log('RPC get_users_with_roles count:', rpcResult.rows.length);

    const childrenCheck = await pool.query('SELECT COUNT(*) FROM public.children');
    console.log(`Stats - Children: ${childrenCheck.rows[0].count}`);

    const profileCheck = await pool.query('SELECT COUNT(*) FROM public.profiles');
    console.log(`Stats - Profiles: ${profileCheck.rows[0].count}`);
  } catch (err) {
    console.error('Error checking stats:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
